import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'

import MindboxEmbeddedBlockNativeView from './MindboxEmbeddedBlockNativeComponent'
import type { NativeProps } from './MindboxEmbeddedBlockNativeComponent'
import { MindboxEmbeddedBlockFailReason } from './MindboxEmbeddedBlockFailReason'

/**
 * The handlers are typed by the props they are handed to, not by a second spelling of the same
 * events.
 *
 * Spelling them out again would mean naming `NativeSyntheticEvent` here as well, and the two names
 * only agree while both resolve to the same React Native. They do not always: a checkout that sits
 * under a folder carrying its own React Native resolves this file's import and the spec's to
 * different copies, and `bob build` then refuses to write the definitions over a `currentTarget`
 * that is a number on one side and a view on the other. Taking the type from the prop leaves
 * nothing to disagree about.
 */
type AppearanceChangeHandler = NonNullable<NativeProps['onAppearanceChange']>
type BlockOutcomeHandler = NonNullable<NativeProps['onBlockOutcome']>

type Appearance = 'placeholder' | 'content' | 'error' | 'collapsed'

const APPEARANCES: Array<string> = ['placeholder', 'content', 'error', 'collapsed']

/** How the load ended — the three words the native blocks report, the same on both platforms. */
type Outcome = 'load' | 'empty' | 'fail'

const OUTCOMES: Array<string> = ['load', 'empty', 'fail']

/** iOS and Android have the native block; nothing else does. */
const IS_SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android'

export type MindboxEmbeddedBlockProps = {
  /**
   * The name of the place from the admin panel. A different name is a different block, built from
   * scratch in place of the old one.
   *
   * Space around the name is not part of it: the SDK trims the name before resolving by it, on both
   * platforms. A name that is empty — or nothing but spaces — is then no name at all, so the place
   * resolves to nothing, collapses and reports [onFail]. The component warns about that.
   */
  placeSystemName: string

  /**
   * The height the block occupies while it loads and while it is shown. A place that ends up without
   * content collapses to zero height and hands the space back.
   *
   * Live: a new value resizes a block already on screen in place — the same content, no reload —
   * exactly as the SwiftUI, Compose and Flutter wrappers behave.
   *
   * It has to be a positive number. A block given no space to occupy is never loaded at all — a page
   * laid out in a zero viewport does not lay itself out again once the space arrives — and reports
   * neither outcome. The component warns about such a height.
   */
  height: number

  /**
   * How long the block waits to find out what to show, in milliseconds. Covers the wait for the
   * answer — the config and the targeting — not the whole life of the block: a page that has already
   * arrived gets its own time to render. When the wait runs out, the block collapses and reports
   * [onFail].
   *
   * The budget is the user's, not the clock's: it ticks only while the screen with the block is
   * actually looked at (see [active]). Omitted means the SDK's own default of 30 seconds; zero and
   * negative values mean it too. The value is taken once, when the block is created — the same rule as
   * in the SwiftUI, Compose and Flutter wrappers — so a new value on a live block is ignored with a
   * warning. Remount the component (give it a new `key`) to change it.
   */
  timeoutMs?: number

  /**
   * Drawn instead of the SDK shimmer while the block is loading. Fills the whole place, as the native
   * placeholder does.
   */
  placeholder?: React.ReactNode

  /**
   * Drawn instead of collapsing when the block cannot be shown.
   *
   * Applies only to failures: an empty place — one with nothing behind its place system name — always
   * collapses, so a host cannot fill the space of a block that was never meant to be there.
   */
  error?: React.ReactNode

  /**
   * The content is shown: the block has taken its height and is visible.
   *
   * Delivered once per outcome, not once per lifetime: the same outcome is never repeated, and an
   * outcome that actually changed — a place that filled up after a failure — is delivered again.
   * The native block reports the same way, so every wrapper of the SDK calls back alike.
   */
  onLoad?: () => void

  /**
   * There is nothing to show at the place: no campaign behind its name, the targeting or the A/B
   * group did not match, the show budget is spent, or the page rendered nothing. A normal outcome,
   * not a breakage: the block collapses, [error] does not apply, and no reason is given — which of
   * these it was is the SDK's business.
   *
   * Delivered on the same rule as [onLoad]: once per outcome, again if the outcome changes.
   */
  onEmpty?: () => void

  /**
   * The block could not be shown: the SDK had no config or never answered, the page could not be
   * loaded, the content is malformed or the SDK hit an internal error. The block collapses, or keeps
   * its height and draws [error] when one is given. An empty place is not a failure and arrives in
   * [onEmpty] instead.
   *
   * The reason is for logs and analytics, not for branching: whatever it is, the block has already
   * collapsed or switched to [error]. Compare it with the constants of
   * [MindboxEmbeddedBlockFailReason] and keep a fallback — a later SDK may add reasons.
   *
   * Delivered on the same rule as [onLoad]: once per outcome, again if the outcome changes. A
   * failure that repeats with a different reason is the same outcome and is not delivered again.
   */
  onFail?: (reason: MindboxEmbeddedBlockFailReason) => void

  /**
   * Whether the screen the block stands on is the one being looked at. `true` by default.
   *
   * The native container watches its window, and in RN that is not enough: a native stack keeps the
   * screens below the top one in the window, so leaving a screen never takes the block out of it.
   * Left alone, the block would spend its whole waiting budget behind another screen and collapse
   * before the user came back. Pass `useIsFocused()` — or whatever the app's navigation calls it.
   */
  active?: boolean

  style?: StyleProp<ViewStyle>
}

/**
 * An embedded Mindbox block.
 *
 * The app marks a *place* by its [placeSystemName] and never learns what goes into it — that is the
 * config's decision, and it can change without an app release. **The host owns the size**: pass the
 * [height] the block should occupy.
 *
 * ```tsx
 * <MindboxEmbeddedBlock placeSystemName="main-screen-top" height={104} />
 * ```
 *
 * Both looks can be customized, the same way as in SwiftUI, Compose and Flutter: [placeholder]
 * replaces the stock loading shimmer, and [error] opts into showing a failure instead of collapsing.
 * Both stay ordinary RN nodes, drawn above the native view, so they resolve the context, the theme
 * and the handlers of the tree the block itself stands in. The wait for an answer is bounded by
 * [timeoutMs] — 30 seconds unless the host says otherwise.
 *
 * The outcome arrives through three callbacks, the same three as in SwiftUI, Compose and Flutter:
 * [onLoad] when the content is shown, [onEmpty] when there is nothing to show at the place, and
 * [onFail] with a reason when the block could not be shown.
 *
 * The component is a thin layer over the native block: the native view holds the SDK's own container
 * — with its waiting budget and its web page — and this component only mirrors the container's
 * decisions in the RN layout.
 *
 * **iOS and Android.** On any other platform the block collapses right away and reports [onFail]
 * with `internalError`, so a layout that hides its section on failure behaves the same everywhere.
 */
export const MindboxEmbeddedBlock = (props: MindboxEmbeddedBlockProps) => <Block key={props.placeSystemName} {...props} />

const Block = ({ placeSystemName, height, timeoutMs, placeholder, error, onLoad, onEmpty, onFail, active = true, style }: MindboxEmbeddedBlockProps) => {
  const [appearance, setAppearance] = useState<Appearance>(IS_SUPPORTED ? 'placeholder' : 'collapsed')

  const blockHeight = Number.isFinite(height) ? Math.max(0, height) : 0

  // The warnings live in effects, not in the render body: React may run a render more than once
  // for a single commit (StrictMode, a suspended tree), and a ref flipped during render would not
  // keep the word from being said twice. An effect runs once per commit.
  //
  // Only the empty name is worth a word. Space around a real name is not a mistake to report: the
  // SDK trims the name before it resolves by it, so a padded name finds its place either way.
  useEffect(() => {
    if (placeSystemName.trim().length === 0) {
      console.warn('[MindboxEmbeddedBlock] A block was created without a place system name: there is nothing to resolve by it, so the place collapses and reports onFail.')
    }
    if (blockHeight <= 0) {
      console.warn(`[MindboxEmbeddedBlock] The block "${placeSystemName}" was created with height ${height}: it reserves no space, so nothing loads and no outcome is reported.`)
    }
    // Creation only: the name remounts the component through its key, and the height is live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const creationTimeoutMs = useRef(timeoutMs).current
  const hasWarnedAboutTimeout = useRef(false)
  useEffect(() => {
    if (timeoutMs === creationTimeoutMs || hasWarnedAboutTimeout.current) {
      return
    }
    hasWarnedAboutTimeout.current = true
    console.warn(`[MindboxEmbeddedBlock] The block "${placeSystemName}" keeps the timeout it was created with; the new value is ignored. Remount the component — give it a new key — to change the timeout.`)
  }, [timeoutMs, creationTimeoutMs, placeSystemName])

  // The callbacks are read through a ref at delivery time, so a host that passes a fresh closure
  // on every render neither re-subscribes anything nor misses the one delivery of an outcome.
  const callbacks = useRef({ onLoad, onEmpty, onFail })
  callbacks.current = { onLoad, onEmpty, onFail }

  /**
   * The outcome delivered last — the deduplication key. Deliberately without the failure reason:
   * a silent retry that fails differently is still the same outcome.
   */
  const deliveredOutcome = useRef<Outcome | null>(null)

  const deliver = useCallback((outcome: Outcome, reason: string | null) => {
    if (outcome === deliveredOutcome.current) {
      return
    }
    deliveredOutcome.current = outcome
    switch (outcome) {
      case 'load':
        callbacks.current.onLoad?.()
        break
      case 'empty':
        callbacks.current.onEmpty?.()
        break
      case 'fail':
        callbacks.current.onFail?.(reason || MindboxEmbeddedBlockFailReason.internalError)
        break
    }
  }, [])

  // No native block to report: the place collapses and the host hears the same failure it would
  // hear from a block that could not be shown. In an effect, after the first commit, as a native
  // block's report would arrive after the first layout.
  useEffect(() => {
    if (!IS_SUPPORTED) {
      deliver('fail', MindboxEmbeddedBlockFailReason.internalError)
    }
  }, [deliver])

  const handleAppearanceChange = useCallback<AppearanceChangeHandler>((event) => {
    const reported = event.nativeEvent.appearance
    if (APPEARANCES.includes(reported)) {
      setAppearance(reported as Appearance)
    }
  }, [])

  const handleOutcome = useCallback<BlockOutcomeHandler>(
    (event) => {
      const { outcome, reason } = event.nativeEvent
      if (OUTCOMES.includes(outcome)) {
        deliver(outcome as Outcome, reason)
      }
    },
    [deliver]
  )

  const overlay = appearance === 'placeholder' ? placeholder : appearance === 'error' ? error : null

  return (
    <View
      // The height is the one thing here that cannot live in a StyleSheet: it is the host's number
      // until the block gives its place back, and then it is zero.
      // eslint-disable-next-line react-native/no-inline-styles
      style={[styles.block, style, { height: appearance === 'collapsed' ? 0 : blockHeight }]}
      collapsable={false}
    >
      {IS_SUPPORTED ? <MindboxEmbeddedBlockNativeView style={StyleSheet.absoluteFill} placeSystemName={placeSystemName} blockHeight={blockHeight} timeoutMs={creationTimeoutMs ?? 0} hasPlaceholder={placeholder != null} hasErrorView={error != null} hostVisible={active} onAppearanceChange={handleAppearanceChange} onBlockOutcome={handleOutcome} /> : null}
      {overlay != null ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {overlay}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  block: {
    width: '100%',
    overflow: 'hidden',
  },
})

export default MindboxEmbeddedBlock
