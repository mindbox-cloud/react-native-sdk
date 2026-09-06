import React, { useEffect, useState } from 'react'
import { Button, FlatList, StyleSheet, Text, View } from 'react-native'
import { useIsFocused } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { BlockStatsRow, FEED, FeedRow, TrackedEmbeddedBlock } from '../components/EmbeddedBlockDemo'
import { blockStats } from '../utils/EmbeddedBlockStats'
import { embeddedBlockHeight, embeddedBlockPlaces } from '../utils/EmbeddedBlockPlaces'
import type { RootStackParamList } from '../navigation'

/**
 * Two embedded blocks, integrated the way the README asks for.
 *
 * The screen is a FlatList and the blocks stand in its header and its footer — the two slots a list
 * never virtualizes — so each block is mounted once for the life of the screen. `active` comes from
 * the navigation: every React Native screen lives in the same native window, and this is how the block
 * learns that another screen is on top of it and stops spending its waiting budget there.
 *
 * What to check by hand: scroll to the end of the feed and back, press "Re-render the screen" a few
 * times, open a screen on top and come back. The row under each block has to stay at
 * "mounted 1 · onLoad 1".
 */
type Props = NativeStackScreenProps<RootStackParamList, 'EmbeddedBlocks'>

const STATS = { top: 'top', bottom: 'bottom' }

const EmbeddedBlocksScreen = ({ navigation }: Props) => {
  const active = useIsFocused()
  const [renders, setRenders] = useState(0)

  // The counters are per visit: forget them when the screen is left.
  useEffect(() => () => blockStats.forget(Object.values(STATS)), [])

  // Elements, not functions. `ListHeaderComponent={() => …}` would be a new component type on every
  // render of the screen, and React would mount the header — with the block in it — from scratch.
  const header = (
    <View style={styles.section}>
      <Text style={styles.title}>Block in ListHeaderComponent</Text>
      <TrackedEmbeddedBlock statsId={STATS.top} placeSystemName={embeddedBlockPlaces.top} height={embeddedBlockHeight} active={active} />
      <BlockStatsRow statsId={STATS.top} active={active} />
      <Text style={styles.hint}>Re-renders of the screen: {renders}. The block does not notice them.</Text>
      <View style={styles.button}>
        <Button title="Re-render the screen" onPress={() => setRenders((count) => count + 1)} />
      </View>
      <View style={styles.button}>
        <Button title="Open a screen on top" onPress={() => navigation.navigate('PushNotification')} />
      </View>
      <View style={styles.button}>
        <Button title="How not to do it" onPress={() => navigation.navigate('EmbeddedBlocksAntiPattern')} />
      </View>
    </View>
  )

  const footer = (
    <View style={styles.section}>
      <Text style={styles.title}>Block in ListFooterComponent</Text>
      <TrackedEmbeddedBlock statsId={STATS.bottom} placeSystemName={embeddedBlockPlaces.bottom} height={embeddedBlockHeight} active={active} />
      <BlockStatsRow statsId={STATS.bottom} active={active} />
    </View>
  )

  return <FlatList data={FEED} keyExtractor={(item) => String(item)} renderItem={({ item }) => <FeedRow index={item} />} ListHeaderComponent={header} ListFooterComponent={footer} contentContainerStyle={styles.content} />
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

export default EmbeddedBlocksScreen
