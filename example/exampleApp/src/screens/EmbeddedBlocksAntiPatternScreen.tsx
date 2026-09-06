import React, { useEffect, useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { ActionBar, BlockStatsRow, Caption, FEED, MockCell, MockCells, TrackedEmbeddedBlock } from '../components/EmbeddedBlockDemo'
import { blockStats } from '../utils/EmbeddedBlockStats'
import { embeddedBlockHeight, embeddedBlockPlaces } from '../utils/EmbeddedBlockPlaces'

/**
 * The same feed, built the way the README warns against.
 *
 * Each mistake here looks harmless and each ends the same way: the host destroys the native view and
 * the SDK builds the place again — a new resolve, the shimmer once more, a second onLoad, a carousel
 * back on its first page. The SDK is doing the right thing; the counters show what the host did.
 *
 * Nothing on this screen belongs in an app. It is here so the counters can be watched growing.
 */
const STATS = { header: 'header-arrow', item: 'list-item' }

const EmbeddedBlocksAntiPatternScreen = () => {
  const [, setRenders] = useState(0)

  useEffect(() => () => blockStats.forget(Object.values(STATS)), [])

  return (
    <FlatList
      data={FEED}
      keyExtractor={(item) => String(item)}
      // Mistake 1: the header is a function. Every render of the screen hands the list a new component
      // type, so React unmounts the old header and mounts a new one — together with the block in it.
      // Pressing "Re-render" is enough to see it. An element, `ListHeaderComponent={header}`, would
      // have kept the block.
      // eslint-disable-next-line react/no-unstable-nested-components
      ListHeaderComponent={() => (
        <View>
          <ActionBar actions={[{ title: 'Re-render', onPress: () => setRenders((count) => count + 1) }]} />
          <MockCells count={2} />
          <Caption>Header given as a function: rebuilt on every re-render of the screen, untouched by scrolling.</Caption>
          {/* Mistake 2, the quiet one: no `active`. The block believes it is looked at even with another screen on top, and spends its waiting budget there. */}
          <TrackedEmbeddedBlock statsId={STATS.header} placeSystemName={embeddedBlockPlaces.feed} height={embeddedBlockHeight} />
          <BlockStatsRow statsId={STATS.header} />
        </View>
      )}
      // Mistake 3: a block as a list item. The render window is squeezed to about one screen here, so
      // the item is unmounted as soon as it scrolls out of view; with the default window (21) the same
      // happens further down the feed, and feeds that long are common. Scroll two screens down and back.
      windowSize={2}
      initialNumToRender={3}
      maxToRenderPerBatch={2}
      renderItem={({ item }) =>
        item === 3 ? (
          <View>
            <Caption>Block as a list item: rebuilt every time it scrolls out of the render window and back, untouched by re-renders.</Caption>
            <TrackedEmbeddedBlock statsId={STATS.item} placeSystemName={embeddedBlockPlaces.feed} height={embeddedBlockHeight} />
            <BlockStatsRow statsId={STATS.item} />
          </View>
        ) : (
          <MockCell />
        )
      }
      contentContainerStyle={styles.content}
    />
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
})

export default EmbeddedBlocksAntiPatternScreen
