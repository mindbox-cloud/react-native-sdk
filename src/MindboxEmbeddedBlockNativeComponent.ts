import type { ViewProps } from 'react-native'
import type { DirectEventHandler, Double, WithDefault } from 'react-native/Libraries/Types/CodegenTypes'
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent'

type AppearanceChangeEvent = Readonly<{
  appearance: string
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

  hasPlaceholder?: WithDefault<boolean, false>

  hasErrorView?: WithDefault<boolean, false>

  hostVisible?: WithDefault<boolean, true>

  onAppearanceChange?: DirectEventHandler<AppearanceChangeEvent>

  onBlockOutcome?: DirectEventHandler<BlockOutcomeEvent>
}

export default codegenNativeComponent<NativeProps>('MindboxEmbeddedBlockView')
