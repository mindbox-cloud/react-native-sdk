import type { ViewProps } from 'react-native'
import type { DirectEventHandler, Double, WithDefault } from 'react-native/Libraries/Types/CodegenTypes'
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent'

type AppearanceChangeEvent = Readonly<{
  appearance: string
}>

export interface NativeProps extends ViewProps {
  placeSystemName?: string

  blockHeight?: Double

  timeoutMs?: Double

  hasPlaceholder?: WithDefault<boolean, false>

  hasErrorView?: WithDefault<boolean, false>

  hostVisible?: WithDefault<boolean, true>

  onAppearanceChange?: DirectEventHandler<AppearanceChangeEvent>

  onBlockLoad?: DirectEventHandler<null>

  onBlockFail?: DirectEventHandler<null>
}

export default codegenNativeComponent<NativeProps>('MindboxEmbeddedBlockView')
