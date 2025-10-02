import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import HomeScreen from './screens/HomeScreen'
import PushNotificationScreen from './screens/PushNotificationScreen'
import NotificationCenterScreen from './screens/NotificationCenterScreen'
import messaging from '@react-native-firebase/messaging'
import { Alert } from 'react-native'
import notifee, { AndroidImportance } from '@notifee/react-native'
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import { isMindboxMessage } from './utils/Notification'

const Stack = createNativeStackNavigator()


function App() {
   useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
        console.log('Remote message:', remoteMessage)
       if (isMindboxMessage(remoteMessage)) {
          console.log('is Mindbox message in foreground')
          return
        }
      const channelId = await notifee.createChannel({ id: 'high-priority', name: 'High Priority', importance: AndroidImportance.HIGH })
      await notifee.displayNotification({
        title: remoteMessage.notification?.title ?? 'Message',
        body: remoteMessage.notification?.body ?? (remoteMessage.data ? JSON.stringify(remoteMessage.data) : ''),
        android: { channelId },
      })
    })
    return unsubscribe
  }, [])
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="PushNotification" component={PushNotificationScreen} />
        <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App
