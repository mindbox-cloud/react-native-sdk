import UIKit
@_spi(Internal) import Mindbox
import MindboxLogger

@objc(MindboxEmbeddedBlockHost)
public final class MindboxEmbeddedBlockHost: NSObject {
    @objc public var onAppearance: ((NSString) -> Void)?

    @objc public var onOutcome: ((NSString) -> Void)?

    @objc public var view: UIView { blockView }

    private let blockView: MindboxEmbeddedBlockView
    private var isTornDown = false

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
        blockView.setAppearanceObserver { [weak self] appearance in
            self?.onAppearance?(Self.name(of: appearance) as NSString)
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

    private static func name(of appearance: MindboxEmbeddedBlockAppearance) -> String {
        switch appearance {
        case .placeholder: return "placeholder"
        case .content: return "content"
        case .error: return "error"
        case .collapsed: return "collapsed"
        }
    }
}

extension MindboxEmbeddedBlockHost: MindboxEmbeddedBlockViewDelegate {
    public func mindboxEmbeddedBlockViewDidLoad(_ blockView: MindboxEmbeddedBlockView) {
        onOutcome?("load")
    }

    public func mindboxEmbeddedBlockViewDidFail(_ blockView: MindboxEmbeddedBlockView) {
        onOutcome?("fail")
    }
}
