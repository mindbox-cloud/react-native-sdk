import { AppRegistry } from 'react-native'
import App from './src/App'
import messaging from '@react-native-firebase/messaging';
import { name as appName } from './app.json'
import notifee, { AndroidImportance, EventType } from '@notifee/react-native'



messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Message handled in the background and draw by system', remoteMessage);
})

notifee.onBackgroundEvent(async ({ type, detail }) => {
    switch (type) {
      case EventType.PRESS:

        break
      case EventType.ACTION_PRESS:

        break
      case EventType.DISMISSED:

        break
      default:
        break
    }
  })

AppRegistry.registerComponent(appName, () => App)
