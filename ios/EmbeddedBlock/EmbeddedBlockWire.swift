@_spi(Internal) import Mindbox

/// The words the block speaks to JS in: the same ones on Android, the same ones the Flutter plugin
/// uses. A contract with the JS side, not derived from anything.
enum EmbeddedBlockWire {
    static let outcomeLoad = "load"
    static let outcomeEmpty = "empty"
    static let outcomeFail = "fail"

    /// `nil` for a word this SDK does not know; an empty word is the default, `automatic`.
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

    /// The SDK's reveal, in whole milliseconds — what JS animates the growth of a hidden block over.
    static var revealDurationMs: Int {
        Int((MindboxEmbeddedBlockView.revealAnimationDuration * 1000).rounded())
    }
}
