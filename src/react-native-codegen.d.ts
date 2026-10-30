// React Native 0.63 ships the codegen modules without type declarations; delete this file once the pinned React Native is 0.71 or later.

declare module 'react-native/Libraries/Types/CodegenTypes' {
  import type { NativeSyntheticEvent } from 'react-native'

  export type Double = number
  export type Float = number
  export type Int32 = number
  export type UnsafeMixed = unknown

  export type WithDefault<Type, _Default> = Type | undefined

  export type DirectEventHandler<Payload, _PaperName = never> = (event: NativeSyntheticEvent<Payload>) => void

  export type BubblingEventHandler<Payload, _PaperName = never> = (event: NativeSyntheticEvent<Payload>) => void
}

declare module 'react-native/Libraries/Utilities/codegenNativeComponent' {
  import type { HostComponent } from 'react-native'

  export default function codegenNativeComponent<Props>(
    componentName: string,
    options?: {
      interfaceOnly?: boolean
      paperComponentName?: string
      paperComponentNameDeprecated?: string
      excludedPlatform?: 'iOS' | 'android'
    }
  ): HostComponent<Props>
}
