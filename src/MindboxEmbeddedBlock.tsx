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
   * The place's system name from the admin panel, matched ignoring letter case and surrounding
   * whitespace. A new name builds a new block.
   */
  placeSystemName: string

  /** The block's height while it is not collapsed; a new value resizes the block in place. Must be positive. */
  height: number

  /**
   * How long, in milliseconds, the block waits for the SDK to choose its content before it fails with
   * `networkError`, counted while its screen is shown (see `active`). Omitted, zero or negative means
   * 30 seconds.
   */
  timeoutMs?: number

  /** What the block shows while it loads; `automatic` by default. */
  loadingStrategy?: MindboxEmbeddedBlockLoadingStrategy

  /**
   * Whether the SDK animates the content's appearance; `true` by default. Set `false` to animate the
   * block's container yourself in `onLoad`.
   */
  animatesReveal?: boolean

  /** Shown instead of the SDK's shimmer while the block loads. */
  placeholder?: React.ReactNode

  /** Shown, instead of collapsing, when the block fails while it takes its height. */
  error?: React.ReactNode

  /** Called when the content is shown. */
  onLoad?: () => void

  /**
   * Called when the block collapses because the place has nothing to show or the data its targeting
   * needs could not be fetched.
   */
  onEmpty?: () => void

  /** Called when the block fails; it collapses or shows `error`. */
  onFail?: (reason: MindboxEmbeddedBlockFailReason) => void

  /**
   * Whether the block's screen is the one in front; `true` by default. Pass `useIsFocused()` or its
   * equivalent: screens under the top one stay in the native window, so the block cannot tell.
   */
  active?: boolean

  style?: StyleProp<ViewStyle>
}

/**
 * Shows the Mindbox embedded block configured for a place in the admin panel.
 *
 * Give it a height and let the layout set its position and width. Keep it in the layout rather than
 * removing it in `onEmpty`: a collapsed block still shows content the place gets later.
 * `timeoutMs`, `loadingStrategy` and `animatesReveal` are read only when the block is created; give
 * the component a new `key` to change them. On platforms other than iOS and Android the block
 * collapses and reports `onFail` with `internalError`.
 *
 * ```tsx
 * <MindboxEmbeddedBlock
 *   placeSystemName="stories"
 *   height={104}
 *   placeholder={<StoriesSkeleton />}
 *   onFail={(reason) => console.log(`stories failed: ${reason}`)}
 * />
 * ```
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
