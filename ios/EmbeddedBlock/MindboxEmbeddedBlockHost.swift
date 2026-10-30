import UIKit
@_spi(Internal) import Mindbox
import MindboxLogger

@objc(MindboxEmbeddedBlockHost)
public final class MindboxEmbeddedBlockHost: NSObject {
    private let onAppearance: (NSString, Bool, Int) -> Void

    private let onOutcome: (NSString, NSString?) -> Void

    @objc public var view: UIView { blockView }

    private let blockView: MindboxEmbeddedBlockView
    private var isTornDown = false

    @objc public init(placeSystemName: String,
                      height: CGFloat,
                      timeoutMs: Double,
                      loadingStrategy: String,
                      animatesReveal: Bool,
                      onAppearance: @escaping (NSString, Bool, Int) -> Void,
                      onOutcome: @escaping (NSString, NSString?) -> Void) {
        let timeout: TimeInterval? = timeoutMs == 0 ? nil : timeoutMs / 1000
        let strategy = EmbeddedBlockWire.loadingStrategy(of: loadingStrategy)
        blockView = MindboxEmbeddedBlockView(placeSystemName: placeSystemName,
                                             height: height,
                                             loadingStrategy: strategy ?? .automatic,
                                             timeout: timeout,
                                             animatesReveal: animatesReveal)
        self.onAppearance = onAppearance
        self.onOutcome = onOutcome
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
        // Last in init: the observer reports the current look synchronously, and JS learns the first look only from it.
        blockView.setAppearanceObserver { [weak self] appearance in
            guard let self, !self.isTornDown else { return }
            self.onAppearance(EmbeddedBlockWire.name(of: appearance) as NSString,
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

extension MindboxEmbeddedBlockHost: MindboxEmbeddedBlockViewDelegate {
    public func mindboxEmbeddedBlockViewDidLoad(_ blockView: MindboxEmbeddedBlockView) {
        guard !isTornDown else { return }
        onOutcome(EmbeddedBlockWire.outcomeLoad as NSString, nil)
    }

    public func mindboxEmbeddedBlockViewDidBecomeEmpty(_ blockView: MindboxEmbeddedBlockView) {
        guard !isTornDown else { return }
        onOutcome(EmbeddedBlockWire.outcomeEmpty as NSString, nil)
    }

    public func mindboxEmbeddedBlockViewDidFail(_ blockView: MindboxEmbeddedBlockView,
                                                reason: MindboxEmbeddedBlockFailReason) {
        guard !isTornDown else { return }
        onOutcome(EmbeddedBlockWire.outcomeFail as NSString, reason.rawValue as NSString)
    }
}
