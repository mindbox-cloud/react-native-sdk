import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'

import MindboxEmbeddedBlockNativeView from './MindboxEmbeddedBlockNativeComponent'
import type { NativeProps } from './MindboxEmbeddedBlockNativeComponent'
import { MindboxEmbeddedBlockFailReason } from './MindboxEmbeddedBlockFailReason'
import { MindboxEmbeddedBlockLoadingStrategy } from './MindboxEmbeddedBlockLoadingStrategy'

// Typed from the spec's props: a second `NativeSyntheticEvent` import breaks `bob build` when two React Native copies resolve.
type AppearanceChangeHandler = NonNullable<NativeProps['onAppearanceChange']>
type BlockOutcomeHandler = NonNullable<NativeProps['onBlockOutcome']>

type Appearance = 'placeholder' | 'content' | 'error' | 'collapsed'

const APPEARANCES: Array<string> = ['placeholder', 'content', 'error', 'collapsed']

type Outcome = 'load' | 'empty' | 'fail'

const OUTCOMES: Array<string> = ['load', 'empty', 'fail']

const IS_SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android'

type Overlay = 'placeholder' | 'error'

const REVEAL_EASING = Platform.OS === 'android' ? Easing.bezier(0.4, 0, 0.2, 1) : Easing.inOut(Easing.ease)

export type MindboxEmbeddedBlockProps = {
  /**
   * The name of the place from the admin panel. A different name is a different block, built from
   * scratch in place of the old one.
   *
   * Passed down as given. Whitespace around the name is not part of it: the native blocks ignore
   * it, so a name pasted from the admin panel with a stray space still finds its place. The name
   * itself is matched the way the native SDK matches it. A name that is empty — or nothing but
   * spaces — is no name at all, so the place resolves to nothing: the block collapses and reports
   * [onEmpty], as for any place with nothing behind it. The component warns about that.
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
   * What the block shows until the SDK answers — see [MindboxEmbeddedBlockLoadingStrategy].
   *
   * `automatic` — the default — keeps the block hidden until the place has shown content once on
   * this device and puts a placeholder there from then on. A block that takes its space up front
   * keeps the layout still at the price of flashing where there is nothing to show; a block that
   * waits hidden never flashes at the price of the layout growing when content arrives. A place
   * that always has a campaign behind it is worth an explicit `placeholder`.
   *
   * A block that waits hidden — `hidden`, and `automatic` at a place that has not shown content
   * yet — draws neither [placeholder] nor [error] until its content has been shown once: a failure
   * keeps it collapsed, and only [onFail] tells.
   *
   * Fixed when the block is created, as [timeoutMs] is: a new value on a live block is ignored with
   * a warning. Remount the component (give it a new `key`) to build a block anew.
   */
  loadingStrategy?: MindboxEmbeddedBlockLoadingStrategy

  /**
   * Whether the SDK animates the reveal of the content — a fade, and the growth of a block that
   * waited hidden. `true` by default; the system's reduced-motion setting turns the animation off
   * as well. Turn it off to animate the block's container yourself in [onLoad].
   *
   * Fixed when the block is created, as [timeoutMs] is.
   */
  animatesReveal?: boolean

  /**
   * Drawn instead of the SDK shimmer while the block is loading. Fills the whole place, as the native
   * placeholder does. Not drawn by a block that waits hidden — see [loadingStrategy] — until its
   * content has been shown once.
   *
   * When the content arrives with the SDK's reveal, the placeholder fades out over it rather than
   * vanishing a frame before the content is opaque.
   */
  placeholder?: React.ReactNode

  /**
   * Drawn instead of collapsing when the block cannot be shown.
   *
   * Applies only to failures: an empty place — one with nothing behind its place system name — always
   * collapses, so a host cannot fill the space of a block that was never meant to be there. Nor is it
   * drawn by a block that waits hidden — see [loadingStrategy] — which never took the space: with the
   * default strategy, a place that has not shown content on this device yet simply stays collapsed
   * on a failure, and only [onFail] tells.
   */
  error?: React.ReactNode

  /**
   * The content is shown: the block has taken its height and is visible. A block that waited hidden
   * is only starting to grow from zero at this moment — a host that measures the block here, or
   * scrolls to it, sees it still at almost no height until the reveal is over.
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
   * its height and draws [error] when one is given — unless it was waiting hidden, see
   * [loadingStrategy]: a block that never took its space stays collapsed whatever [error] says. An
   * empty place is not a failure and arrives in [onEmpty] instead.
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
 * What the block shows until the SDK has decided what goes into it is the [loadingStrategy]: a
 * placeholder, nothing, or — by default — nothing until the place has shown content once on this
 * device and a placeholder from then on. The content is revealed with the SDK's own animation — it
 * fades in, and a block that started hidden grows to its height — unless [animatesReveal] is off.
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

const Block = ({ placeSystemName, height, timeoutMs, loadingStrategy = MindboxEmbeddedBlockLoadingStrategy.automatic, animatesReveal = true, placeholder, error, onLoad, onEmpty, onFail, active = true, style }: MindboxEmbeddedBlockProps) => {
  const creationTimeoutMs = useRef(timeoutMs).current
  const creationLoadingStrategy = useRef(loadingStrategy).current
  const creationAnimatesReveal = useRef(animatesReveal).current

  const [appearance, setAppearance] = useState<Appearance>(() => (IS_SUPPORTED ? firstLook(creationLoadingStrategy) : 'collapsed'))

  const blockHeight = Number.isFinite(height) ? Math.max(0, height) : 0

  useEffect(() => {
    if (placeSystemName.trim().length === 0) {
      console.warn('[MindboxEmbeddedBlock] A block was created without a place system name: there is nothing to resolve by it, so the place collapses and reports onEmpty.')
    }
    if (blockHeight <= 0) {
      console.warn(`[MindboxEmbeddedBlock] The block "${placeSystemName}" was created with height ${height}: it reserves no space, so nothing loads and no outcome is reported.`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const warnedCreationValues = useRef(new Set<string>())
  useEffect(() => {
    const warnIfIgnored = (name: string, given: unknown, kept: unknown) => {
      if (given === kept || warnedCreationValues.current.has(name)) {
        return
      }
      warnedCreationValues.current.add(name)
      console.warn(`[MindboxEmbeddedBlock] The block "${placeSystemName}" was given ${name} ${String(given)} after creation and keeps ${String(kept)}: ${name} is fixed when the block is created. Remount the component — give it a new key — to build a block anew.`)
    }
    warnIfIgnored('timeoutMs', timeoutMs, creationTimeoutMs)
    warnIfIgnored('loadingStrategy', loadingStrategy, creationLoadingStrategy)
    warnIfIgnored('animatesReveal', animatesReveal, creationAnimatesReveal)
  }, [timeoutMs, creationTimeoutMs, loadingStrategy, creationLoadingStrategy, animatesReveal, creationAnimatesReveal, placeSystemName])

  const callbacks = useRef({ onLoad, onEmpty, onFail })
  callbacks.current = { onLoad, onEmpty, onFail }

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

  useEffect(() => {
    if (!IS_SUPPORTED) {
      deliver('fail', MindboxEmbeddedBlockFailReason.internalError)
    }
  }, [deliver])

  const reveal = useRef(new Animated.Value(1)).current
  const overlayFade = useRef(new Animated.Value(1)).current
  const [fadingOverlay, setFadingOverlay] = useState<Overlay | null>(null)
  const fadeGeneration = useRef(0)
  const shownAppearance = useRef(appearance)

  const show = useCallback(
    (next: Appearance, revealDurationMs?: number) => {
      const previous = shownAppearance.current
      const duration = revealDurationMs ?? 0
      const reveals = next === 'content' && duration > 0
      shownAppearance.current = next
      setAppearance(next)

      if (reveals && previous === 'collapsed') {
        reveal.setValue(0)
        Animated.timing(reveal, { toValue: 1, duration, easing: REVEAL_EASING, useNativeDriver: false }).start()
      } else {
        reveal.stopAnimation()
        reveal.setValue(1)
      }

      fadeGeneration.current += 1
      const generation = fadeGeneration.current
      overlayFade.stopAnimation()
      if (reveals && (previous === 'placeholder' || previous === 'error')) {
        setFadingOverlay(previous)
        overlayFade.setValue(1)
        Animated.timing(overlayFade, { toValue: 0, duration, easing: REVEAL_EASING, useNativeDriver: false }).start(({ finished }) => {
          if (finished && fadeGeneration.current === generation) {
            setFadingOverlay(null)
          }
        })
      } else {
        setFadingOverlay(null)
        overlayFade.setValue(1)
      }
    },
    [reveal, overlayFade]
  )

  const handleAppearanceChange = useCallback<AppearanceChangeHandler>(
    (event) => {
      const { appearance: reported, animated, revealDurationMs } = event.nativeEvent
      if (APPEARANCES.includes(reported) && reported !== shownAppearance.current) {
        show(reported as Appearance, animated ? revealDurationMs : undefined)
      }
    },
    [show]
  )

  const handleOutcome = useCallback<BlockOutcomeHandler>(
    (event) => {
      const { outcome, reason } = event.nativeEvent
      if (OUTCOMES.includes(outcome)) {
        deliver(outcome as Outcome, reason)
      }
    },
    [deliver]
  )

  const shownOverlay: Overlay | null = appearance === 'placeholder' || appearance === 'error' ? appearance : fadingOverlay
  const overlay = shownOverlay === 'placeholder' ? placeholder : shownOverlay === 'error' ? error : null
  const isOverlayFading = shownOverlay != null && shownOverlay !== appearance

  const slotHeight = useMemo(() => reveal.interpolate({ inputRange: [0, 1], outputRange: [0, blockHeight] }), [reveal, blockHeight])

  return (
    <Animated.View
      // eslint-disable-next-line react-native/no-inline-styles
      style={[styles.block, style, { height: appearance === 'collapsed' ? 0 : slotHeight }]}
      collapsable={false}
    >
      {/* A native view of zero size never loads, so the block keeps its full height under a collapsed slot. */}
      <View style={[styles.inside, { height: blockHeight }]} collapsable={false}>
        {IS_SUPPORTED ? <MindboxEmbeddedBlockNativeView style={StyleSheet.absoluteFill} placeSystemName={placeSystemName} blockHeight={blockHeight} timeoutMs={creationTimeoutMs ?? 0} loadingStrategy={creationLoadingStrategy} animatesReveal={creationAnimatesReveal} hasPlaceholder={placeholder != null} hasErrorView={error != null} hostVisible={active} onAppearanceChange={handleAppearanceChange} onBlockOutcome={handleOutcome} /> : null}
        {overlay != null ? (
          <Animated.View style={[StyleSheet.absoluteFill, isOverlayFading ? { opacity: overlayFade } : null]} pointerEvents={isOverlayFading ? 'none' : 'box-none'}>
            {overlay}
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  )
}

const firstLook = (strategy: MindboxEmbeddedBlockLoadingStrategy): Appearance => (strategy === MindboxEmbeddedBlockLoadingStrategy.placeholder ? 'placeholder' : 'collapsed')

const styles = StyleSheet.create({
  block: {
    width: '100%',
    overflow: 'hidden',
  },
  inside: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
})

export default MindboxEmbeddedBlock
