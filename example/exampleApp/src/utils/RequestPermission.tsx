import { requestNotifications, RESULTS } from 'react-native-permissions';
import MindboxSdk from "mindbox-sdk";

export const requestNotificationPermission = async () => {
  requestNotifications(['alert', 'sound']).then(({ status, settings }) => {
    if (status === RESULTS.GRANTED) {
      console.log('Permission granted');
    } else {
      console.log('Permission not granted');
    }
  });
};
