import React, { useEffect, useState } from 'react'
import { Button, FlatList, StyleSheet, Text, View } from 'react-native'
import { BlockStatsRow, FEED, FeedRow, TrackedEmbeddedBlock } from '../components/EmbeddedBlockDemo'
import { blockStats } from '../utils/EmbeddedBlockStats'
import { embeddedBlockHeight, embeddedBlockPlaces } from '../utils/EmbeddedBlockPlaces'

/**
 * The same screen, built the way the README warns against.
 *
 * Each mistake here looks harmless and each ends the same way: the host destroys the native view and
 * the SDK builds the place again — a new resolve, the shimmer once more, a second onLoad, a carousel
 * back on its first page. The SDK is doing the right thing; the counters show what the host did.
 *
 * Nothing on this screen belongs in an app. It is here so the counters can be watched growing.
 */
const STATS = { header: 'header-arrow', item: 'list-item' }

const EmbeddedBlocksAntiPatternScreen = () => {
  const [renders, setRenders] = useState(0)

  useEffect(() => () => blockStats.forget(Object.values(STATS)), [])

  return (
    <FlatList
      data={FEED}
      keyExtractor={(item) => String(item)}
      // Mistake 1: the header is a function. Every render of the screen hands the list a new component
      // type, so React unmounts the old header and mounts a new one — together with the block in it.
      // Pressing "Re-render the screen" is enough to see it. An element, `ListHeaderComponent={header}`,
      // would have kept the block.
      // eslint-disable-next-line react/no-unstable-nested-components
      ListHeaderComponent={() => (
        <View style={styles.section}>
          <Text style={styles.title}>Header as an arrow function</Text>
          {/* Mistake 2, the quiet one: no `active`. The block believes it is looked at even with another screen on top, and spends its waiting budget there. */}
          <TrackedEmbeddedBlock statsId={STATS.header} placeSystemName={embeddedBlockPlaces.top} height={embeddedBlockHeight} />
          <BlockStatsRow statsId={STATS.header} />
          <Text style={styles.hint}>Re-renders of the screen: {renders}. Each one builds the block again.</Text>
          <View style={styles.button}>
            <Button title="Re-render the screen" onPress={() => setRenders((count) => count + 1)} />
          </View>
        </View>
      )}
      // Mistake 3: a block as a list item. The render window is squeezed to about one screen here, so
      // the item is unmounted as soon as it scrolls out of view; with the default window (21) the same
      // happens further down the feed, and feeds that long are common. Scroll two screens down and back.
      windowSize={2}
      initialNumToRender={2}
      maxToRenderPerBatch={2}
      renderItem={({ item }) =>
        item === 2 ? (
          <View style={styles.section}>
            <Text style={styles.title}>Block inside renderItem</Text>
            <TrackedEmbeddedBlock statsId={STATS.item} placeSystemName={embeddedBlockPlaces.bottom} height={embeddedBlockHeight} />
            <BlockStatsRow statsId={STATS.item} />
          </View>
        ) : (
          <FeedRow index={item} />
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
  section: {
    paddingVertical: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: '#6e6e73',
    marginTop: 12,
  },
  button: {
    marginTop: 8,
  },
})

export default EmbeddedBlocksAntiPatternScreen
