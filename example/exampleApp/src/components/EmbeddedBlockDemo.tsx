import React, { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { MindboxEmbeddedBlock } from 'mindbox-sdk'
import type { MindboxEmbeddedBlockProps } from 'mindbox-sdk'
import { blockStats, useBlockStats } from '../utils/EmbeddedBlockStats'

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

/** A row of the demo feed — the content the blocks stand among. */
export const FeedRow = ({ index }: { index: number }) => (
  <View style={styles.feedRow}>
    <View style={styles.feedThumb} />
    <View style={styles.feedLines}>
      <Text style={styles.feedTitle}>Product {index + 1}</Text>
      <Text style={styles.feedSubtitle}>A list item: scrolls away, gets reused, re-renders</Text>
    </View>
  </View>
)

/** Enough rows to scroll the blocks well out of view. */
export const FEED = Array.from({ length: 30 }, (_, index) => index)

const styles = StyleSheet.create({
  block: {
    borderRadius: 12,
    backgroundColor: '#f2f2f7',
  },
  stats: {
    marginTop: 6,
    fontSize: 12,
    color: '#6e6e73',
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
    color: '#6e6e73',
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  feedThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#e0e0e6',
  },
  feedLines: {
    flex: 1,
  },
  feedTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  feedSubtitle: {
    fontSize: 12,
    color: '#6e6e73',
    marginTop: 2,
  },
})
