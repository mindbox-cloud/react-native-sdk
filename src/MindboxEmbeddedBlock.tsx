import React, { useCallback, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import type { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native'

import MindboxEmbeddedBlockNativeView from './MindboxEmbeddedBlockNativeComponent'

type Appearance = 'placeholder' | 'content' | 'error' | 'collapsed'

const APPEARANCES: Array<string> = ['placeholder', 'content', 'error', 'collapsed']

/**
 * Why the place ended up without content.
 *
 * Empty today, and an object rather than nothing on purpose: the SDK does not yet tell a timeout from
 * an empty place from a network failure, and when it does the reason lands here without breaking a
 * single caller.
 */
export type MindboxEmbeddedBlockFailure = {}

export type MindboxEmbeddedBlockProps = {
  /**
   * The name of the place from the admin panel. A different name is a different block, built from
   * scratch in place of the old one.
   *
   * Taken exactly as given: nothing is trimmed, so spaces around the name are part of it and keep
   * the block from matching the place. A name that is empty — or nothing but spaces — resolves to
   * nothing at all, so the place collapses and reports [onFail]. The component warns about both.
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

  /** The content is shown. */
  onLoad?: () => void

  /**
   * The place ended up without content: the load failed or timed out, or there is nothing behind the
   * name. An empty place is a normal outcome, not a breakage.
   */
  onFail?: (failure: MindboxEmbeddedBlockFailure) => void

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
 * Both outcomes can be customized, the same way as in SwiftUI, Compose and Flutter: [placeholder]
 * replaces the stock loading shimmer, and [error] opts into showing a failure instead of collapsing.
 * Both stay ordinary RN nodes, drawn above the native view, so they resolve the context, the theme
 * and the handlers of the tree the block itself stands in. The wait for an answer is bounded by
 * [timeoutMs] — 30 seconds unless the host says otherwise.
 *
 * The component is a thin layer over the native block: the native view holds the SDK's own container
 * — with its waiting budget and its web page — and this component only mirrors the container's
 * decisions in the RN layout.
 */
export const MindboxEmbeddedBlock = (props: MindboxEmbeddedBlockProps) => <Block key={props.placeSystemName} {...props} />

const Block = ({ placeSystemName, height, timeoutMs, placeholder, error, onLoad, onFail, active = true, style }: MindboxEmbeddedBlockProps) => {
  const [appearance, setAppearance] = useState<Appearance>('placeholder')

  const blockHeight = Number.isFinite(height) ? Math.max(0, height) : 0

  const hasWarnedAboutCreation = useRef(false)
  if (!hasWarnedAboutCreation.current) {
    hasWarnedAboutCreation.current = true
    if (placeSystemName.trim().length === 0) {
      console.warn('[MindboxEmbeddedBlock] A block was created without a place system name: there is nothing to resolve by it, so the place collapses and reports onFail.')
    } else if (placeSystemName.trim() !== placeSystemName) {
      console.warn(`[MindboxEmbeddedBlock] The block "${placeSystemName}" was given a place system name with spaces around it. The name is used as it is, so it will not match the place from the admin panel.`)
    }
    if (blockHeight <= 0) {
      console.warn(`[MindboxEmbeddedBlock] The block "${placeSystemName}" was created with height ${height}: it reserves no space, so nothing loads and no outcome is reported.`)
    }
  }

  const creationTimeoutMs = useRef(timeoutMs).current
  const hasWarnedAboutTimeout = useRef(false)
  if (timeoutMs !== creationTimeoutMs && !hasWarnedAboutTimeout.current) {
    hasWarnedAboutTimeout.current = true
    console.warn(`[MindboxEmbeddedBlock] The block "${placeSystemName}" keeps the timeout it was created with; the new value is ignored. Remount the component — give it a new key — to change the timeout.`)
  }

  const deliveredOutcome = useRef<'load' | 'fail' | null>(null)

  const handleAppearanceChange = useCallback((event: NativeSyntheticEvent<{ appearance: string }>) => {
    const reported = event.nativeEvent.appearance
    if (APPEARANCES.includes(reported)) {
      setAppearance(reported as Appearance)
    }
  }, [])

  const handleLoad = useCallback(() => {
    if (deliveredOutcome.current === 'load') {
      return
    }
    deliveredOutcome.current = 'load'
    onLoad?.()
  }, [onLoad])

  const handleFail = useCallback(() => {
    if (deliveredOutcome.current === 'fail') {
      return
    }
    deliveredOutcome.current = 'fail'
    onFail?.({})
  }, [onFail])

  const overlay = appearance === 'placeholder' ? placeholder : appearance === 'error' ? error : null

  return (
    <View style={[styles.block, style, { height: appearance === 'collapsed' ? 0 : blockHeight }]} collapsable={false}>
      <MindboxEmbeddedBlockNativeView style={StyleSheet.absoluteFill} placeSystemName={placeSystemName} blockHeight={blockHeight} timeoutMs={creationTimeoutMs ?? 0} hasPlaceholder={placeholder != null} hasErrorView={error != null} hostVisible={active} onAppearanceChange={handleAppearanceChange} onBlockLoad={handleLoad} onBlockFail={handleFail} />
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
