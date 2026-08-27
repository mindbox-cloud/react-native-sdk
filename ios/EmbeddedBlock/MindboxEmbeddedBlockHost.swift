import UIKit
@_spi(Internal) import Mindbox
import MindboxLogger

/// The Swift side of one embedded block: the SDK's own container, plus the two signals it sends up.
///
/// The block itself is `MindboxEmbeddedBlockView`, whole and unchanged — the resolver, the waiting
/// budget, the page and its bridge stay on the native side, and React Native gets a view to place and
/// the signals to react to.
///
/// Why a separate class at all: the Fabric component view is Objective-C++ (its base class and the
/// generated event emitters are C++), and the block's wrapper API is behind `@_spi(Internal)`, which
/// only Swift can import. So the block lives here and the component view drives it — the same split
/// the module already uses for its Turbo module.
@objc(MindboxEmbeddedBlockHost)
public final class MindboxEmbeddedBlockHost: NSObject {

    /// Native → RN: where the block stands now, as one of the wire words.
    @objc public var onAppearance: ((NSString) -> Void)?

    /// Native → RN: how the load ended — `load` or `fail`.
    @objc public var onOutcome: ((NSString) -> Void)?

    /// The view to put on screen.
    @objc public var view: UIView { blockView }

    private let blockView: MindboxEmbeddedBlockView
    private var isTornDown = false

    /// `timeoutMs` comes in the wire spelling — whole milliseconds, zero for "the host said nothing".
    /// Zero turns back into the nil the SDK reads as its own default; anything else — a negative
    /// included — is converted to the seconds the container counts in and handed over as it is, for the
    /// container to sanitize and log.
    @objc public init(placeSystemName: String, height: CGFloat, timeoutMs: Double) {
        let timeout: TimeInterval? = timeoutMs == 0 ? nil : timeoutMs / 1000
        blockView = MindboxEmbeddedBlockView(placeSystemName: placeSystemName, height: height, timeout: timeout)
        super.init()

        if placeSystemName.isEmpty {
            Logger.common(message: "[EmbeddedBlock] A React Native block was created without a place system name and has nothing to resolve",
                          level: .error,
                          category: .embeddedBlocks)
        }

        blockView.delegate = self
        // Last: subscribing hands out the current appearance right away, and a place with nothing behind
        // it settles synchronously inside this call.
        blockView.setAppearanceObserver { [weak self] appearance in
            self?.onAppearance?(Self.name(of: appearance) as NSString)
        }
    }

    /// Whether the host still shows the block. `true` by default, so a caller that says nothing behaves
    /// as a native host does.
    @objc public func setHostVisible(_ isHostVisible: Bool) {
        blockView.setHostVisible(isHostVisible)
    }

    /// Puts an empty view where the host draws its own screen.
    ///
    /// An RN node cannot be handed to the container: it belongs to Fabric, which mounts it, and to Yoga,
    /// which lays it out. So the container is not given the screen — it is given the fact that the place
    /// is taken. That is all it needs: its own shimmer is held back, and a failed block keeps its height
    /// instead of collapsing. What is drawn there is an RN overlay above this view.
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

    /// The RN view is gone, so the block's screen is gone with it.
    ///
    /// Not named `release`: Objective-C does not allow a method by that name, and this class is driven
    /// from Objective-C++.
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
        // The stand-in is a placeholder for space, not for touches: what the host drew over it is an RN
        // view, and it is RN that has to hear the taps on it.
        standIn.isUserInteractionEnabled = false
        return standIn
    }

    /// Spelled out rather than derived from the case name: the wire word is a contract with the JS side,
    /// and renaming a case in the SDK must not quietly change it.
    private static func name(of appearance: MindboxEmbeddedBlockAppearance) -> String {
        switch appearance {
        case .placeholder: return "placeholder"
        case .content: return "content"
        case .error: return "error"
        case .collapsed: return "collapsed"
        }
    }
}

// MARK: - MindboxEmbeddedBlockViewDelegate

extension MindboxEmbeddedBlockHost: MindboxEmbeddedBlockViewDelegate {

    public func mindboxEmbeddedBlockViewDidLoad(_ blockView: MindboxEmbeddedBlockView) {
        onOutcome?("load")
    }

    public func mindboxEmbeddedBlockViewDidFail(_ blockView: MindboxEmbeddedBlockView) {
        onOutcome?("fail")
    }
}
