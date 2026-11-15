import UIKit

@objc(MindboxEmbeddedBlockHostAdapter)
final class EmbeddedBlockHostAdapter: NSObject, MindboxEmbeddedBlockHosting, MindboxEmbeddedBlockHostMaking {
    private let host: MindboxEmbeddedBlockHost

    private init(host: MindboxEmbeddedBlockHost) {
        self.host = host
    }

    static func makeHost(withPlaceSystemName placeSystemName: String,
                         height: CGFloat,
                         timeoutMs: Double,
                         loadingStrategy: String,
                         animatesReveal: Bool,
                         onAppearance: @escaping (String, Bool, Int) -> Void,
                         onOutcome: @escaping (String, String?) -> Void) -> any MindboxEmbeddedBlockHosting {
        EmbeddedBlockHostAdapter(host: MindboxEmbeddedBlockHost(placeSystemName: placeSystemName,
                                                                height: height,
                                                                timeoutMs: timeoutMs,
                                                                loadingStrategy: loadingStrategy,
                                                                animatesReveal: animatesReveal,
                                                                onAppearance: { onAppearance($0 as String, $1, $2) },
                                                                onOutcome: { onOutcome($0 as String, $1 as String?) }))
    }

    var view: UIView { host.view }

    func setHostVisible(_ isHostVisible: Bool) {
        host.setHostVisible(isHostVisible)
    }

    func setStandIns(hasPlaceholder: Bool, hasErrorView: Bool) {
        host.setStandIns(hasPlaceholder: hasPlaceholder, hasErrorView: hasErrorView)
    }

    func tearDown() {
        host.tearDown()
    }
}
