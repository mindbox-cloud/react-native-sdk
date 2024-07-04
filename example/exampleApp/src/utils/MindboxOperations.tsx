import MindboxSdk, { LogLevel } from 'mindbox-sdk';
import Snackbar from 'react-native-snackbar';
import { Alert } from 'react-native';

// Define the operation names
const asyncViewProductOperationName = "viewProduct";
const syncRecoOperationName = "categoryReco.sync";
const asyncOperationNCOpenName = "mobileapp.NCOpen";
const asyncOperationNCPushOpenName = "mobileapp.NCPushOpen";

// Async operation request body
const requestProductOperationBodyAsync = {
  "viewProduct": {
    "productGroup": {
      "ids": {
        "website": "test-1"
      }
    }
  }
};

// Sync operation request body
const requestRecoBodySync = {
  "recommendation": {
    "limit": 100,
    "productCategory": {
      "ids": {
        "website": "156"
      }
    },
    "area": {
      "ids": {
        "externalId": "1345ff"
      }
    }
  }
};


const sendAsync = () => {
  // https://developers.mindbox.ru/docs/integration-actions-react-native
  MindboxSdk.executeAsyncOperation({
    operationSystemName: asyncViewProductOperationName,
    operationBody: requestProductOperationBodyAsync
  });
  Alert.alert("Mindbox Async Operation", "The operation was sent.");
};

const sendSync = async () => {
  // https://developers.mindbox.ru/docs/integration-actions-react-native
  MindboxSdk.executeSyncOperation({
    operationSystemName: syncRecoOperationName,
    operationBody: requestRecoBodySync,
    onSuccess: (data) => {
      // On success, display the response data
      Alert.alert("Mindbox Sync Operation Success", JSON.stringify(data, null, 2));
    },
    onError: (error) => {
      // On error, display the error message
      Alert.alert("Mindbox Sync Operation Error", JSON.stringify(error, null, 2));
    }
  });
};

// Async operation to send action "notification center was opened"
const asyncOperationNCOpen = () => {
  MindboxSdk.executeAsyncOperation({
    operationSystemName: asyncOperationNCOpenName,
    operationBody: {}
  });
  Snackbar.show({
    text: `Send operation: Notification center opened`,
    duration: Snackbar.LENGTH_SHORT,
  });
};

// Async operation to send "click on push from notification center"
const asyncOperationNCPushOpen = (pushName: string, pushDate: string) => {
  const requestBody = {
    "data": {
      "customerAction": {
        "customFields": {
          "mobPushSendDateTime": pushDate,
          "mobPushTranslateName": pushName
        }
      }
    }
  };

  MindboxSdk.executeAsyncOperation({
    operationSystemName: asyncOperationNCPushOpenName,
    operationBody: requestBody
  });
  Snackbar.show({
    text: `Send operation: push opened from notification center`,
    duration: Snackbar.LENGTH_SHORT,
  });
};

export { sendSync, sendAsync, asyncOperationNCPushOpen, asyncOperationNCOpen  };
