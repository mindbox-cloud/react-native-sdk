import type { ViewProps } from 'react-native'
import type { DirectEventHandler, Double, Int32, WithDefault } from 'react-native/Libraries/Types/CodegenTypes'
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent'

/**
 * The look the native block shows: `placeholder`, `content`, `error` or `collapsed`. `animated` is
 * `true` for the one change that is the SDK's reveal of content — the native block owns that
 * decision, gates included — and `revealDurationMs` is how long it takes; both are `false` and `0`
 * for every other change.
 */
type AppearanceChangeEvent = Readonly<{
  appearance: string
  animated: boolean
  revealDurationMs: Int32
}>

/**
 * How the load ended: `load`, `empty` or `fail`. The reason goes with a failure and is empty
 * otherwise — an event payload has every field, so the absence is spelled as an empty string.
 */
type BlockOutcomeEvent = Readonly<{
  outcome: string
  reason: string
}>

export interface NativeProps extends ViewProps {
  placeSystemName?: string

  blockHeight?: Double

  timeoutMs?: Double

  /** `automatic`, `placeholder` or `hidden`; an empty word means `automatic`. */
  loadingStrategy?: string

  animatesReveal?: WithDefault<boolean, true>

  hasPlaceholder?: WithDefault<boolean, false>

  hasErrorView?: WithDefault<boolean, false>

  hostVisible?: WithDefault<boolean, true>

  onAppearanceChange?: DirectEventHandler<AppearanceChangeEvent>

  onBlockOutcome?: DirectEventHandler<BlockOutcomeEvent>
}

export default codegenNativeComponent<NativeProps>('MindboxEmbeddedBlockView')
