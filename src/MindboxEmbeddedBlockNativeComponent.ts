import type { ViewProps } from 'react-native'
import type { DirectEventHandler, Double, WithDefault } from 'react-native/Libraries/Types/CodegenTypes'
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent'

/**
 * What the embedded block needs across the native boundary.
 *
 * The block is a view, not a call, so nothing here lands on the Turbo module: what crosses is one
 * native component, the props the container reads, and the two signals the native block sends up —
 * how it occupies its place and how its load ended.
 *
 * The wire words (`placeholder`, `content`, `error`, `collapsed`) are a contract with both native
 * sides and are spelled out there, not derived from enum case names.
 */
type AppearanceChangeEvent = Readonly<{
  /** One of `placeholder`, `content`, `error`, `collapsed`. A word this version does not know is ignored. */
  appearance: string
}>

export interface NativeProps extends ViewProps {
  /** The name of the place from the admin panel — what the native block resolves its content by. */
  placeSystemName?: string

  /**
   * The height the block occupies, in points. Read only by the iOS side, and only to keep the
   * container's own log honest: the frame itself comes from the style, as it does for every RN view.
   */
  blockHeight?: Double

  /**
   * How long the container waits for the answer about what to show, in whole milliseconds.
   *
   * Milliseconds because that is the one spelling both native sides can take without losing anything:
   * Android counts its budget in them, iOS in seconds. Zero stands for "the host said nothing" — an
   * absent prop crosses the boundary as the default, and the default has to mean something — and the
   * container falls back to its own 30 seconds. The value is handed over once, when the block is
   * built; the container cannot re-budget a running wait, so a change on a live block is not applied.
   */
  timeoutMs?: Double

  /**
   * Whether the host draws a loading screen of its own.
   *
   * Not the screen itself: the container is told only that the place is taken, and answers by
   * holding back its own shimmer. What is drawn there is an RN overlay above the native view.
   */
  hasPlaceholder?: WithDefault<boolean, false>

  /**
   * Whether the host draws a failure of its own — the same arrangement as [hasPlaceholder], with one
   * difference: this is also what opts the block into showing a failure at all. Without it a failed
   * block collapses.
   */
  hasErrorView?: WithDefault<boolean, false>

  /**
   * Whether the host still shows the block.
   *
   * The container watches its window, and in RN that is not enough: a screen left behind in a native
   * stack keeps its views in the window, so the block would spend its whole waiting budget on a
   * screen nobody is looking at.
   */
  hostVisible?: WithDefault<boolean, true>

  /** Where the block stands now — a state that repeats, not an event. */
  onAppearanceChange?: DirectEventHandler<AppearanceChangeEvent>

  /** The content is shown. */
  onBlockLoad?: DirectEventHandler<null>

  /**
   * The place ended up without content: the load failed or timed out, or there is nothing behind the
   * name. Carries no payload yet — the reason lands here once the SDK tells the outcomes apart.
   */
  onBlockFail?: DirectEventHandler<null>
}

export default codegenNativeComponent<NativeProps>('MindboxEmbeddedBlockView')
