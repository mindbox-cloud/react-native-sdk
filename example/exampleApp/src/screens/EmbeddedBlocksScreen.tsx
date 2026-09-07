import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { useIsFocused } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ActionBar, BlockStatsRow, MockCells, TrackedEmbeddedBlock } from '../components/EmbeddedBlockDemo'
import { blockStats } from '../utils/EmbeddedBlockStats'
import { embeddedBlockHeight, embeddedBlockPlaces } from '../utils/EmbeddedBlockPlaces'
import type { RootStackParamList } from '../navigation'

/**
 * An embedded block among the host's own cells, integrated the way the README asks for.
 *
 * The screen is a ScrollView: the block scrolls away with the content and stays mounted, so it is
 * created once for the life of the screen. `active` comes from the navigation — every React Native
 * screen lives in the same native window, and this is how the block learns that another screen is
 * on top of it and stops spending its waiting budget there.
 *
 * What to check by hand: scroll to the bottom and back, press "Re-render" a few times, open a screen
 * on top and come back. The row under the block has to stay at "mounted 1 · onLoad 1", and the block's
 * own clock must keep counting: a clock back at zero means the page was loaded again.
 */
type Props = NativeStackScreenProps<RootStackParamList, 'EmbeddedBlocks'>

const STATS = 'feed'

const EmbeddedBlocksScreen = ({ navigation }: Props) => {
  const active = useIsFocused()
  const [, setRenders] = useState(0)

  // The counters are per visit: forget them when the screen is left.
  useEffect(() => () => blockStats.forget([STATS]), [])

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ActionBar
        actions={[
          { title: 'Re-render', onPress: () => setRenders((count) => count + 1) },
          { title: 'Screen on top', onPress: () => navigation.navigate('PushNotification') },
          { title: 'How not to do it', primary: true, onPress: () => navigation.navigate('EmbeddedBlocksAntiPattern') },
        ]}
      />
      <MockCells count={2} />
      <TrackedEmbeddedBlock statsId={STATS} placeSystemName={embeddedBlockPlaces.feed} height={embeddedBlockHeight} active={active} />
      <BlockStatsRow statsId={STATS} active={active} />
      <MockCells count={14} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
})

export default EmbeddedBlocksScreen
