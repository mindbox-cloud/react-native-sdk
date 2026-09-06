import React, { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MindboxEmbeddedBlock } from 'mindbox-sdk'
import type { MindboxEmbeddedBlockProps } from 'mindbox-sdk'
import { blockStats, useBlockStats } from '../utils/EmbeddedBlockStats'
import { useLocalTestBanner } from '../utils/EmbeddedBlockPlaces'
import { LocalTestBanner } from './LocalTestBanner'

type TrackedEmbeddedBlockProps = Pick<MindboxEmbeddedBlockProps, 'placeSystemName' | 'height' | 'timeoutMs' | 'active'> & {
  /** The counter row this block reports to. Keep it the same for the life of the screen. */
  statsId: string
}

/**
 * `MindboxEmbeddedBlock` with the demo counters attached.
 *
 * Nothing about the block changes, the wrapper only counts. Its mount effect has no dependencies, so
 * it runs again only when the component — and with it the native view of the block — is created anew.
 * That is the number that tells a good integration from a bad one.
 *
 * The placeholder and the error view are the host's own: the placeholder replaces the SDK shimmer
 * while the block loads, the error view is shown instead of collapsing when the block fails.
 */
export const TrackedEmbeddedBlock = ({ statsId, ...block }: TrackedEmbeddedBlockProps) => {
  useEffect(() => {
    blockStats.mounted(statsId)
    // Mount only. A dependency here would count re-renders, and a re-render is exactly what does
    // not recreate the block.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // TEMPORARY: the local banner stands where the block would, see EmbeddedBlockPlaces.ts.
  if (useLocalTestBanner) {
    return <LocalTestBanner height={block.height} onLoad={() => blockStats.loaded(statsId)} />
  }

  return <MindboxEmbeddedBlock {...block} style={styles.block} placeholder={<BlockSkeleton />} error={<BlockUnavailable />} onLoad={() => blockStats.loaded(statsId)} onFail={() => blockStats.failed(statsId)} />
}

/** The counter row under a block. Turns red once the block has been built more than once. */
export const BlockStatsRow = ({ statsId, active }: { statsId: string; active?: boolean }) => {
  const stats = useBlockStats(statsId)
  const recreated = stats.mounts > 1
  const parts = [`mounted ${stats.mounts}`, `onLoad ${stats.loads}`, `onFail ${stats.fails}`]
  if (active !== undefined) {
    parts.push(`active ${active ? 'yes' : 'no'}`)
  }
  return <Text style={[styles.stats, recreated && styles.statsRecreated]}>{parts.join(' · ')}</Text>
}

const BlockSkeleton = () => (
  <View style={styles.skeleton}>
    <View style={styles.skeletonTile} />
    <View style={styles.skeletonTile} />
    <View style={styles.skeletonTile} />
  </View>
)

const BlockUnavailable = () => (
  <View style={styles.unavailable}>
    <Text style={styles.unavailableText}>The block could not be shown</Text>
  </View>
)

/** A faceless cell of the host's own content: a thumbnail and two lines, no words to read. */
export const MockCell = () => (
  <View style={styles.cell}>
    <View style={styles.cellThumb} />
    <View style={styles.cellLines}>
      <View style={styles.cellLine} />
      <View style={[styles.cellLine, styles.cellLineShort]} />
    </View>
  </View>
)

/** Several cells in a row. */
export const MockCells = ({ count }: { count: number }) => (
  <>
    {Array.from({ length: count }, (_, index) => (
      <MockCell key={index} />
    ))}
  </>
)

/** Enough rows to scroll a block well out of view. */
export const FEED = Array.from({ length: 30 }, (_, index) => index)

type Action = { title: string; onPress: () => void }

/** A compact row of the demo's controls. */
export const ActionBar = ({ actions }: { actions: Array<Action> }) => (
  <View style={styles.actions}>
    {actions.map((action) => (
      <Pressable key={action.title} onPress={action.onPress} style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
        <Text style={styles.actionText}>{action.title}</Text>
      </Pressable>
    ))}
  </View>
)

const styles = StyleSheet.create({
  block: {
    borderRadius: 16,
    backgroundColor: '#f2f2f7',
  },
  stats: {
    marginTop: 6,
    marginBottom: 4,
    fontSize: 12,
    color: '#8e8e93',
  },
  statsRecreated: {
    color: '#c0392b',
    fontWeight: '600',
  },
  skeleton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  skeletonTile: {
    flex: 1,
    height: '65%',
    borderRadius: 8,
    backgroundColor: '#e0e0e6',
  },
  unavailable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableText: {
    fontSize: 13,
    color: '#8e8e93',
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  cellThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#e5e5ea',
  },
  cellLines: {
    flex: 1,
    gap: 8,
  },
  cellLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e5e5ea',
  },
  cellLineShort: {
    width: '55%',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  action: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#e9e9ee',
  },
  actionPressed: {
    opacity: 0.6,
  },
  actionText: {
    fontSize: 13,
    color: '#1c1c1e',
  },
})
