import React, { useEffect, useCallback, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Platform, Button } from 'react-native';
import MindboxSdk, { LogLevel, CopyPayloadInAppCallback, EmptyInAppCallback,
  InAppCallback, UrlInAppCallback } from "mindbox-sdk";
import { sendSync, sendAsync } from '../utils/MindboxOperations';
import { requestNotificationPermission } from '../utils/RequestPermission';
import PushNotificationScreen from './screens/PushNotificationScreen';
import { useNavigation } from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';

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
    requestNotificationPermission()
    getFcmToken();

  }, []);
  const getFcmToken = async () => {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      console.log('FCM Token:', fcmToken);
      Alert.alert('FCM Token', fcmToken);
    } else {
      console.log('Failed to get FCM token');
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
