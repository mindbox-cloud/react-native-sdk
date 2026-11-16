
[![npm version](https://badge.fury.io/js/mindbox-sdk.svg)](https://www.npmjs.com/package/mindbox-sdk)

# Mindbox SDK for React Native

The Mindbox SDK allows developers to integrate mobile push notifications, in-app messages, and client events into your React Native projects.

## Getting Started

These instructions will help you integrate the Mindbox SDK into your React Native app.

### Installation

Follow the installation process detailed [here](https://developers.mindbox.ru/docs/add-sdk-react-native). Overview:

1. Install the Mindbox SDK package:
   ```markdown
    npm i --save mindbox-sdk
    ```
   The package requires React Native 0.76 or newer, on the old or the new architecture.

2. For iOS, make sure to install the pods:
   ```markdown
    cd ios && pod install && cd ..
    ```

### Swift Package Manager (preview)

React Native 0.88 and newer can link native libraries through Swift Package Manager instead of CocoaPods ([React Native docs](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/scripts/spm/__docs__/README.md)). React Native marks this flow as a preview; CocoaPods stays the default. The package ships a `Package.swift` for it:

1. Every native library in the app needs a `Package.swift`: `npx react-native spm add` refuses the project otherwise.
2. Run `npx react-native spm add` in the app. Do not add the native Mindbox SDK to the app target: this package brings it.
3. Notification extensions cannot stay on CocoaPods, because `spm add` refuses a project that still has pods. In Xcode, add the package `https://github.com/mindbox-cloud/ios-sdk` with the rule "Up to Next Major Version" from the version that this package pins in its `Package.swift`. Link `MindboxNotificationsService` to the Notification Service Extension and `MindboxNotificationsContent` to the Notification Content Extension.
4. `AppDelegate` code stays as with CocoaPods: `import MindboxSdk` and `MindboxJsDelivery.emitEvent(response)`.

### Initialization

Initialize the Mindbox SDK in your React Native app. You can find the necessary code snippet and explanations [here](https://developers.mindbox.ru/docs/sdk-initialization-react-native).

### Operations

Learn how to send events to Mindbox. Different operations and their usage are detailed [here](https://developers.mindbox.ru/docs/integration-actions-react-native).

### Push Notifications

Mindbox SDK aids in handling push notifications. It offers configurations and usage instructions, found in the SDK documentation [Android(FCM)](https://developers.mindbox.ru/docs/firebase-send-push-notifications-react-native), [Android(HCM)](https://developers.mindbox.ru/docs/huawei-send-push-notifications-react-native), [IOS](https://developers.mindbox.ru/docs/ios-send-push-notifications-react-native) and [IOS(Rich)](https://developers.mindbox.ru/docs/ios-send-rich-push-react-native).

## Troubleshooting

Feel free to refer to the [Example of integration](https://github.com/mindbox-cloud/react-native-sdk/tree/develop/example) in case of any issues.

## Further Help

If you need further assistance, don't hesitate to contact us.

## License

This library is open source, available under the explicit terms of the [License](https://github.com/mindbox-cloud/react-native-sdk/blob/master/LICENSE.md).

For a comprehensive understanding, we recommend reading the Mindbox [React Native SDK](https://developers.mindbox.ru/docs/react-native-sdk-integration) documentation.
