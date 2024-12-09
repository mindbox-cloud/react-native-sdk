import React, { useEffect, useState, useRef } from 'react'
import { SafeAreaView, StyleSheet, Text, View, Button, ActivityIndicator, Platform } from 'react-native'
import MindboxSdk, { LogLevel } from 'mindbox-sdk'
import { WebView } from 'react-native-webview'

// Configuration for Mindbox SDK initialization
const configuration = {
  domain: 'api.mindbox.ru',
  endpointId: Platform.OS === 'ios' ? 'your-ios-endpoint-system-name' : 'your-android-endpoint-system-name',
  subscribeCustomerIfCreated: true,
  shouldCreateCustomer: true,
}

// Timeout for waiting to fetch the deviceUUID.
// The page will not start loading until this timeout expires.
// During the first initialization on Android, fetching may take a few seconds,
// while subsequent attempts typically take less than 250 ms.
const MAX_UUID_WAIT_TIME = Platform.OS === 'ios' ? 250 : 4000

const HomeScreen = () => {
  const [deviceUUID, setDeviceUUID] = useState(null)
  const [canLoadWebView, setCanLoadWebView] = useState(false)
  const webViewRef = useRef(null)
  const webViewUrl = 'https://example.com'

  // Function to synchronize deviceUUID with the JS SDK
  const synchronizeDeviceUUID = (uuid) => `
    try {
      const deviceUUID = '${uuid || ''}';
      if (deviceUUID) {
        document.cookie = "mindboxDeviceUUID=" + deviceUUID;
        localStorage.setItem('mindboxDeviceUUID', deviceUUID);
        window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'successSync' }));
      } else {
        window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'errorSync', message: 'deviceUUID is null or undefined' }));
      }
    } catch (error) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'errorSync', message: error.message }));
    }
  `

  // Handler for messages received from the WebView
  const onMessage = (event) => {
    const data = JSON.parse(event.nativeEvent.data)
    // Using switch statement to handle different cases
    switch (data.status) {
      case 'errorSync':
        console.error('JavaScript execution error:', data.message)
        break
      case 'successSync':
        console.log('Synchronization successful.')
        break
      default:
        if (data.cookies || data.deviceUUID) {
          console.log('Cookies:', data.cookies)
          console.log('Device UUID from JS SDK:', data.deviceUUID)
          console.log('Device UUID from mobile SDK:', deviceUUID)
        } else if (data.error) {
          console.error('Error from WebView:', data.error)
        } else {
          console.log('Unhandled message:', data)
        }
        break
    }
  }

  // Debugging method for synchronization.
  // Displays the deviceUUID stored in cookies, localStorage, and the mobile device UUID.
  // These values of deviceUUID should match.
  const showData = () => {
    if (!webViewRef.current) {
      console.error('WebView is not initialized.')
      return
    }
    const script = `
      (function() {
        try {
          const cookies = document.cookie || 'No cookies found';
          const deviceUUID = localStorage.getItem('mindboxDeviceUUID') || 'No deviceUUID found';
          window.ReactNativeWebView.postMessage(JSON.stringify({
            cookies,
            deviceUUID
          }));
        } catch (error) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ error: error.message }));
        }
      })();
    `
    webViewRef.current.injectJavaScript(script)
  }

  useEffect(() => {
    // Attempts to fetch the mobile device UUID within the specified timeout (MAX_UUID_WAIT_TIME).
    // The page will start loading either as soon as the UUID is fetched or after the timeout expires.
    // If the UUID cannot be fetched, synchronization will happen on the next page load or app launch.
    const initialize = async () => {
      try {
        console.log('Starting waitForDeviceUUID...')
        const uuid = await waitForDeviceUUID(MAX_UUID_WAIT_TIME)
        setDeviceUUID(uuid)
        setCanLoadWebView(true)
        console.log('Finished waitForDeviceUUID, Device UUID:', uuid)
      } catch (error) {
        // Even if fetching the deviceUUID times out during the initial page load,
        // synchronization will occur on subsequent page loads or app launches.
        MindboxSdk.getDeviceUUID((uuid) => {
          setDeviceUUID(uuid)
          console.log('Device UUID received after timeout:', uuid)
        })
        setCanLoadWebView(true)
      }
    }

    // Initialize the Mindbox SDK
    const appInitializationCallback = async () => {
      try {
        await MindboxSdk.initialize(configuration)
      } catch (error) {
        console.log(error)
      }
    }

    appInitializationCallback()
    initialize()
    MindboxSdk.setLogLevel(LogLevel.DEBUG)
    MindboxSdk.getToken((token) => {
      console.log('Token:', token)
    })
    MindboxSdk.getSdkVersion((version) => {
      console.log('Sdk version:', version)
    })
  }, [])

  // Fetches the deviceUUID within the specified timeout period.
  // Note: The MAX_UUID_WAIT_TIME should not be set to less than 250 ms,
  // as the deviceUUID might not be fetched in time.
  const waitForDeviceUUID = (timeout) => {
    return new Promise((resolve, reject) => {
      const timeoutHandler = setTimeout(() => {
        console.log('Device UUID not received within timeout')
        reject(new Error('Device UUID not received within timeout'))
      }, timeout)

      MindboxSdk.getDeviceUUID((uuid) => {
        console.log('Device UUID received:', uuid)
        clearTimeout(timeoutHandler)
        resolve(uuid)
      })
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      {canLoadWebView ? (
        <>
          <WebView style={styles.webView} ref={webViewRef} source={{ uri: webViewUrl }} javaScriptEnabled={true} domStorageEnabled={true} injectedJavaScriptBeforeContentLoaded={synchronizeDeviceUUID(deviceUUID)} onMessage={onMessage} />
          <View style={styles.buttonContainer}>
            <Button title="Show Data" onPress={showData} />
          </View>
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Waiting for Device UUID...</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
})

export default HomeScreen
