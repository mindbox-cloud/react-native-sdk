import React, { useEffect, useCallback, useState } from 'react'
import { SafeAreaView, StyleSheet, Text, View, Platform, Button } from 'react-native'
import MindboxSdk, { LogLevel, CopyPayloadInAppCallback, EmptyInAppCallback, InAppCallback, UrlInAppCallback } from 'mindbox-sdk'
import { sendSync, sendAsync, asyncOperationNCOpen } from '../utils/MindboxOperations'
import { requestNotificationPermission } from '../utils/RequestPermission'
import PushNotificationScreen from './screens/PushNotificationScreen'
import { useNavigation } from '@react-navigation/native'
import { chooseInappCallback, RegisterInappCallback } from '../utils/InAppCallbacks'

const configuration = {
  domain: 'api.mindbox.ru',
  // Set your endpoints system name for ios and android below
  endpointId: Platform.OS === 'ios' ? 'Mpush-test.IosRnExample' : 'Mpush-test.AndroidRnExample',
  subscribeCustomerIfCreated: true,
  shouldCreateCustomer: true,
}

const HomeScreen = () => {
  const navigation = useNavigation()
  const [deviceUUID, setDeviceUUID] = useState('Empty')
  const [token, setToken] = useState('Empty')
  const [pushData, setPushData] = useState({
    pushUrl: null,
    pushPayload: null,
  })
  const [sdkVersion, setSdkVersion] = useState('Empty')

  useEffect(() => {
    // https://developers.mindbox.ru/docs/%D0%BC%D0%B5%D1%82%D0%BE%D0%B4%D1%8B-react-natice-sdk#setloglevel-since-280
    MindboxSdk.setLogLevel(LogLevel.DEBUG)

    requestNotificationPermission()
    appInitializationCallback()

    // https://developers.mindbox.ru/docs/%D0%BC%D0%B5%D1%82%D0%BE%D0%B4%D1%8B-react-natice-sdk#getdeviceuuid
    MindboxSdk.getDeviceUUID((uuid: string) => {
      setDeviceUUID(uuid)

      // https://developers.mindbox.ru/docs/%D0%BC%D0%B5%D1%82%D0%BE%D0%B4%D1%8B-react-natice-sdk#gettoken
      MindboxSdk.getTokens((t: string) => {
        setToken(t)

        // https://developers.mindbox.ru/docs/%D0%BC%D0%B5%D1%82%D0%BE%D0%B4%D1%8B-react-natice-sdk#getsdkversion-since-280
        MindboxSdk.getSdkVersion((version) => {
          setSdkVersion(version)
        })
      })
    })

    // https://developers.mindbox.ru/docs/in-app#react-native
    chooseInappCallback(RegisterInappCallback.DEFAULT)
  }, [appInitializationCallback])

  const appInitializationCallback = useCallback(async () => {
    try {
      // https://developers.mindbox.ru/docs/%D0%BC%D0%B5%D1%82%D0%BE%D0%B4%D1%8B-react-natice-sdk#mindboxinitialize
      await MindboxSdk.initialize(configuration)
    } catch (error) {
      console.log(error)
    }
  }, [])

  const getPushData = useCallback(
    (pushUrl: String | null, pushPayload: String | null) => {
      setTimeout(() => {
        // https://developers.mindbox.ru/docs/flutter-push-navigation-react-native
        navigateToPushNotificationIfRequired(pushUrl)
        setPushData({ pushUrl, pushPayload })
      }, 600)
    },
    [navigateToPushNotificationIfRequired]
  )

  useEffect(() => {
    // https://developers.mindbox.ru/docs/%D0%BC%D0%B5%D1%82%D0%BE%D0%B4%D1%8B-react-natice-sdk#onpushclickreceived
    MindboxSdk.onPushClickReceived(getPushData)
  }, [getPushData])

  const handleSendAsyncPress = () => {
    sendAsync()
  }

  const handleSendSyncPress = () => {
    sendSync()
  }

  const handleOpenNotificationCenterPress = () => {
    asyncOperationNCOpen()
    navigation.navigate('NotificationCenter')
  }

  const navigateToPushNotificationIfRequired = useCallback(
    (pushUrl) => {
      if (pushUrl && pushUrl.includes('gotoanotherscreen')) {
        navigation.navigate('PushNotification')
      }
    },
    [navigation]
  )
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.text}>{`Device UUID: ${deviceUUID}`}</Text>
        <Text style={styles.text}>{`Token: ${token}`}</Text>
        <Text style={styles.text}>{`Push URL: ${pushData.pushUrl}`}</Text>
        <Text style={styles.text}>{`Push Payload: ${pushData.pushPayload}`}</Text>
        <Text style={styles.text}>{`SdkVersion: ${sdkVersion}`}</Text>
      </View>
      <View style={styles.buttonsContainer}>
        <Button title="Send Async" onPress={handleSendAsyncPress} />
        <View style={styles.buttonSpacing} />
        <Button title="Send Sync" onPress={handleSendSyncPress} />
        <View style={styles.buttonSpacing} />
        <Button title="Go to notification center" onPress={handleOpenNotificationCenterPress} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  buttonsContainer: {
    marginTop: 20,
    width: '80%',
  },
  buttonSpacing: {
    height: 10,
  },
  text: {
    fontSize: 16,
    marginVertical: 5,
  },
})

export default HomeScreen
