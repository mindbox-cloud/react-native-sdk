@_spi(Internal) import Mindbox

enum EmbeddedBlockWire {
    static let outcomeLoad = "load"
    static let outcomeEmpty = "empty"
    static let outcomeFail = "fail"

    static func loadingStrategy(of word: String?) -> MindboxEmbeddedBlockLoadingStrategy? {
        switch word {
        case nil, "", "automatic": return .automatic
        case "placeholder": return .placeholder
        case "hidden": return .hidden
        default: return nil
        }
    }

    static func name(of appearance: MindboxEmbeddedBlockAppearance) -> String {
        switch appearance {
        case .placeholder: return "placeholder"
        case .content: return "content"
        case .error: return "error"
        case .collapsed: return "collapsed"
        }
    }

    static var revealDurationMs: Int {
        Int((MindboxEmbeddedBlockView.revealAnimationDuration * 1000).rounded())
    }
}
