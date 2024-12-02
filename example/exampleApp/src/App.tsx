import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import HomeScreen from './screens/HomeScreen'
import PushNotificationScreen from './screens/PushNotificationScreen'

const Stack = createNativeStackNavigator()

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="PushNotification" component={PushNotificationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App
