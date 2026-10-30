import type { ViewProps } from 'react-native'
import type { DirectEventHandler, Double, Int32, WithDefault } from 'react-native/Libraries/Types/CodegenTypes'
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent'

type AppearanceChangeEvent = Readonly<{
  appearance: string
  animated: boolean
  revealDurationMs: Int32
}>

type BlockOutcomeEvent = Readonly<{
  outcome: string
  reason: string
}>

export interface NativeProps extends ViewProps {
  placeSystemName?: string

  blockHeight?: Double

  timeoutMs?: Double

  loadingStrategy?: string

  animatesReveal?: WithDefault<boolean, true>

  hasPlaceholder?: WithDefault<boolean, false>

  hasErrorView?: WithDefault<boolean, false>

  hostVisible?: WithDefault<boolean, true>

  onAppearanceChange?: DirectEventHandler<AppearanceChangeEvent>

  onBlockOutcome?: DirectEventHandler<BlockOutcomeEvent>
}

export default codegenNativeComponent<NativeProps>('MindboxEmbeddedBlockView')
