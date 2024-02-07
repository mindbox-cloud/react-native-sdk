import MindboxSdk, { LogLevel } from 'mindbox-sdk';
import { Alert } from 'react-native';

// Define the operation names
const asyncOperationName = "viewProduct";
const syncOperationName = "categoryReco.sync";

// Async operation request body
const requestBodyAsync = {
  "viewProduct": {
    "productGroup": {
      "ids": {
        "website": "test-1"
      }
    }
  }
};

// Sync operation request body
const requestBodySync = {
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
    operationSystemName: asyncOperationName,
    operationBody: requestBodyAsync
  });
  Alert.alert("Mindbox Async Operation", "The operation was sent.");
};

const sendSync = async () => {
  // https://developers.mindbox.ru/docs/integration-actions-react-native
  MindboxSdk.executeSyncOperation({
    operationSystemName: syncOperationName,
    operationBody: requestBodySync,
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

export { sendSync, sendAsync };
