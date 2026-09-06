import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import HomeScreen from './screens/HomeScreen'
import PushNotificationScreen from './screens/PushNotificationScreen'
import NotificationCenterScreen from './screens/NotificationCenterScreen'
import EmbeddedBlocksScreen from './screens/EmbeddedBlocksScreen'
import EmbeddedBlocksAntiPatternScreen from './screens/EmbeddedBlocksAntiPatternScreen'
import type { RootStackParamList } from './navigation'

const Stack = createNativeStackNavigator<RootStackParamList>()

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="PushNotification" component={PushNotificationScreen} />
        <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} />
        <Stack.Screen name="EmbeddedBlocks" component={EmbeddedBlocksScreen} options={{ title: 'Embedded blocks' }} />
        <Stack.Screen name="EmbeddedBlocksAntiPattern" component={EmbeddedBlocksAntiPatternScreen} options={{ title: 'Embedded blocks: how not to' }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App
