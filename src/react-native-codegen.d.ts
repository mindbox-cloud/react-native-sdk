/**
 * The codegen vocabulary, for the React Native this repo pins.
 *
 * A native component's spec has to name its prop types in the words the native codegen reads —
 * `Double`, `WithDefault`, `DirectEventHandler` — and import them, along with
 * `codegenNativeComponent`, from these exact paths. React Native 0.63 ships both files as plain
 * JavaScript with no declarations next to them, so TypeScript has nothing to go on and the spec
 * would be an implicit `any`.
 *
 * Declared here rather than worked around: the paths are what the generator expects, and a spec
 * written any other way stops producing the Android view manager delegate and the iOS component
 * descriptor. What the runtime does with the two modules is unaffected — on the old renderer
 * `codegenNativeComponent` falls back to `requireNativeComponent`, on the new one the generated
 * view config takes over.
 *
 * Delete this file once the pinned React Native is 0.71 or later: from there React Native ships
 * its own TypeScript types and these declarations become its own.
 */

declare module 'react-native/Libraries/Types/CodegenTypes' {
  import type { NativeSyntheticEvent } from 'react-native'

  export type Double = number
  export type Float = number
  export type Int32 = number
  export type UnsafeMixed = unknown

  /**
   * A prop the native side gives a default to. Left out on the JS side, it crosses the boundary as
   * that default, which is why the JS type stays optional.
   */
  export type WithDefault<Type, _Default> = Type | undefined

  /** An event the native view sends to this view's own handler. */
  export type DirectEventHandler<Payload, _PaperName = never> = (event: NativeSyntheticEvent<Payload>) => void

  /** An event the native view sends up the tree. */
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
