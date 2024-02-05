import React, { useEffect, useCallback, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Platform } from 'react-native';
import MindboxSdk, { LogLevel } from 'mindbox-sdk';

const configuration = {
  domain: 'api.mindbox.ru',
  endpointId:
    Platform.OS === 'ios'
      ? 'mpush-test-iOS'
      : 'Mpush-test.AndroidRnExample',
  subscribeCustomerIfCreated: true,
  shouldCreateCustomer: true,
};

const App = () => {
  const [deviceUUID, setDeviceUUID] = useState('Empty');
  const [token, setToken] = useState('Empty');
  const [pushData, setPushData] = useState({ pushUrl: null, pushPayload: null });
  const [sdkVersion, setSdkVersion] = useState('Empty');

  useEffect(() => {
    appInitializationCallback();
    // https://developers.mindbox.ru/docs/%D0%BC%D0%B5%D1%82%D0%BE%D0%B4%D1%8B-react-natice-sdk#setloglevel-since-280
    MindboxSdk.setLogLevel(LogLevel.DEBUG);
    // https://developers.mindbox.ru/docs/%D0%BC%D0%B5%D1%82%D0%BE%D0%B4%D1%8B-react-natice-sdk#getdeviceuuid
    MindboxSdk.getDeviceUUID(setDeviceUUID);
    // https://developers.mindbox.ru/docs/%D0%BC%D0%B5%D1%82%D0%BE%D0%B4%D1%8B-react-natice-sdk#gettoken
    MindboxSdk.getToken(setToken);
    // https://developers.mindbox.ru/docs/%D0%BC%D0%B5%D1%82%D0%BE%D0%B4%D1%8B-react-natice-sdk#getsdkversion-since-280
    MindboxSdk.getSdkVersion((version) => { setSdkVersion(version) });
  }, []);

  const appInitializationCallback = useCallback(async () => {
    try {
      // https://developers.mindbox.ru/docs/%D0%BC%D0%B5%D1%82%D0%BE%D0%B4%D1%8B-react-natice-sdk#mindboxinitialize
      await MindboxSdk.initialize(configuration);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const getPushData = useCallback((pushUrl: String | null, pushPayload: String | null) => {
    setTimeout(() => {
      setPushData({ pushUrl, pushPayload });
    }, 600);
  }, []);

  useEffect(() => {
    // https://developers.mindbox.ru/docs/%D0%BC%D0%B5%D1%82%D0%BE%D0%B4%D1%8B-react-natice-sdk#onpushclickreceived
    MindboxSdk.onPushClickReceived(getPushData);
  }, [getPushData]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.text}>{`Device UUID: ${deviceUUID}`}</Text>
        <Text style={styles.text}>{`Token: ${token}`}</Text>
        <Text style={styles.text}>{`Push URL: ${pushData.pushUrl}`}</Text>
        <Text style={styles.text}>{`Push Payload: ${pushData.pushPayload}`}</Text>
        <Text style={styles.text}>{`SdkVersion: ${sdkVersion}`}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  text: {
    fontSize: 16,
    marginVertical: 5,
  },
});

export default App;
