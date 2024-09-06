import React, { useEffect, useCallback, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Platform, Button } from 'react-native';
import MindboxSdk, { LogLevel, CopyPayloadInAppCallback, EmptyInAppCallback,
  InAppCallback, UrlInAppCallback } from "mindbox-sdk";
import { requestNotificationPermission } from '../utils/RequestPermission';
import { useNavigation } from '@react-navigation/native';
import { chooseInappCallback, RegisterInappCallback } from '../utils/InAppCallbacks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const configuration = {
  domain: 'api.mindbox.ru',
  // Set your endpoints system name for ios and android below
  endpointId:
    Platform.OS === 'ios'
      ? ''
      : '',
  subscribeCustomerIfCreated: true,
  shouldCreateCustomer: true,
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const [deviceUUID, setDeviceUUID] = useState('Empty');
  const [token, setToken] = useState('Empty');
  const [pushData, setPushData] = useState({ pushUrl: null, pushPayload: null });
  const [sdkVersion, setSdkVersion] = useState('Empty');

  useEffect(() => {
    checkIfUpdatedOrReinstalled()
    requestNotificationPermission()
    appInitializationCallback()
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

  const checkIfUpdatedOrReinstalled = async () => {
    try {
      const isFirstLaunch = await AsyncStorage.getItem('hasLaunched');
      if (isFirstLaunch === null) {
        await AsyncStorage.setItem('hasLaunched', 'true');
        Alert.alert('App Installed or Reinstalled');
      } else {
        Alert.alert('App Updated');
      }
    } catch (error) {
      console.error('Error checking app status', error);
    }
  };
const navigateToPushNotificationIfRequired = useCallback((pushUrl) => {
    if (pushUrl && pushUrl.includes("gotoanotherscreen")) {
      navigation.navigate('PushNotification');
    }
  }, [navigation]);
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
});

export default HomeScreen;
