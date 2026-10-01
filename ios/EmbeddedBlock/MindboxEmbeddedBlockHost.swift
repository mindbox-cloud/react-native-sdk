import UIKit
@_spi(Internal) import Mindbox
import MindboxLogger

@objc(MindboxEmbeddedBlockHost)
public final class MindboxEmbeddedBlockHost: NSObject {
    /// The appearance word, whether this change is the SDK's animated reveal, and how long it takes.
    @objc public var onAppearance: ((NSString, Bool, Int) -> Void)?

    /// The outcome word and, for a failure, the reason's raw value.
    @objc public var onOutcome: ((NSString, NSString?) -> Void)?

    @objc public var view: UIView { blockView }

    private let blockView: MindboxEmbeddedBlockView
    private var isTornDown = false

    /// `loadingStrategy` is a word — `automatic`, `placeholder` or `hidden`; a word this SDK does not
    /// know is logged and read as `automatic`. Both it and `animatesReveal` are fixed here, as the
    /// native block takes them only through its initializer.
    @objc public init(placeSystemName: String,
                      height: CGFloat,
                      timeoutMs: Double,
                      loadingStrategy: String,
                      animatesReveal: Bool) {
        let timeout: TimeInterval? = timeoutMs == 0 ? nil : timeoutMs / 1000
        let strategy = EmbeddedBlockWire.loadingStrategy(of: loadingStrategy)
        blockView = MindboxEmbeddedBlockView(placeSystemName: placeSystemName,
                                             height: height,
                                             loadingStrategy: strategy ?? .automatic,
                                             timeout: timeout,
                                             animatesReveal: animatesReveal)
        super.init()

        if placeSystemName.isEmpty {
            Logger.common(message: "[EmbeddedBlock] A React Native block was created without a place system name and has nothing to resolve",
                          level: .error,
                          category: .embeddedBlocks)
        }
        if strategy == nil {
            Logger.common(message: "[EmbeddedBlock] A React Native block for place '\(placeSystemName)' was given a loading strategy this SDK does not know ('\(loadingStrategy)') and starts as automatic",
                          level: .error,
                          category: .embeddedBlocks)
        }

        blockView.delegate = self
        // `isRevealAnimated` is read while the observer runs: the block sets it right before it
        // calls, for that one call. The block owns the gates — `animatesReveal`, a window to animate
        // in, Reduce Motion off, "only the arrival of content" — and this host only passes its word
        // on; the growth of a block that waited hidden is then the JS side's.
        blockView.setAppearanceObserver { [weak self] appearance in
            guard let self else { return }
            self.onAppearance?(EmbeddedBlockWire.name(of: appearance) as NSString,
                               self.blockView.isRevealAnimated,
                               EmbeddedBlockWire.revealDurationMs)
        }
    }

    @objc public func setHostVisible(_ isHostVisible: Bool) {
        blockView.setHostVisible(isHostVisible)
    }

    @objc public func setStandIns(hasPlaceholder: Bool, hasErrorView: Bool) {
        if hasPlaceholder {
            if blockView.placeholderView == nil {
                blockView.placeholderView = Self.makeStandIn()
            }
        } else {
            blockView.placeholderView = nil
        }

        if hasErrorView {
            if blockView.errorView == nil {
                blockView.errorView = Self.makeStandIn()
            }
        } else {
            blockView.errorView = nil
        }
    }

    @objc public func tearDown() {
        guard !isTornDown else { return }

        isTornDown = true
        onAppearance = nil
        onOutcome = nil
        blockView.setAppearanceObserver(nil)
        blockView.delegate = nil
        blockView.release()
    }

    private static func makeStandIn() -> UIView {
        let standIn = UIView()
        standIn.backgroundColor = .clear
        standIn.isUserInteractionEnabled = false
        return standIn
    }
}

// All three methods are implemented on purpose: the protocol gives each an empty default, so a
// host that still spelled the old `DidFail(_:)` would compile and silently hear no failure.
extension MindboxEmbeddedBlockHost: MindboxEmbeddedBlockViewDelegate {
    public func mindboxEmbeddedBlockViewDidLoad(_ blockView: MindboxEmbeddedBlockView) {
        onOutcome?(EmbeddedBlockWire.outcomeLoad as NSString, nil)
    }

    public func mindboxEmbeddedBlockViewDidBecomeEmpty(_ blockView: MindboxEmbeddedBlockView) {
        onOutcome?(EmbeddedBlockWire.outcomeEmpty as NSString, nil)
    }

    public func mindboxEmbeddedBlockViewDidFail(_ blockView: MindboxEmbeddedBlockView,
                                                reason: MindboxEmbeddedBlockFailReason) {
        onOutcome?(EmbeddedBlockWire.outcomeFail as NSString, reason.rawValue as NSString)
    }
}
