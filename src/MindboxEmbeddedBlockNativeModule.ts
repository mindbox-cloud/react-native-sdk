import { NativeModules } from 'react-native'

/**
 * What the native SDK answers about a block before the block exists.
 *
 * The native blocks decide the first look of an `automatic` block synchronously, from the SDK's
 * memory of the place, through a static `initialAppearance`. JS cannot reach anything
 * synchronously, so the same question goes over the bridge to the `MindboxSdk` native module —
 * the one module the SDK already has, on both renderers — and is answered with an appearance word:
 * `placeholder`, `content`, `error` or `collapsed`.
 *
 * Internal: not exported from the package. The component asks; a host has no reason to.
 */
export const askInitialAppearance = (placeSystemName: string, loadingStrategy: string): Promise<string> => {
  const module = NativeModules.MindboxSdk
  if (module == null || typeof module.embeddedBlockInitialAppearance !== 'function') {
    return Promise.reject(new Error('the MindboxSdk native module has no embeddedBlockInitialAppearance'))
  }
  return module.embeddedBlockInitialAppearance(placeSystemName, loadingStrategy)
}
