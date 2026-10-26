
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
   The package requires React Native 0.71 or newer, on the old or the new architecture.

2. For iOS, make sure to install the pods:
   ```markdown
    cd ios && pod install && cd ..
    ```

### Initialization

Initialize the Mindbox SDK in your React Native app. You can find the necessary code snippet and explanations [here](https://developers.mindbox.ru/docs/sdk-initialization-react-native).

### Operations

Learn how to send events to Mindbox. Different operations and their usage are detailed [here](https://developers.mindbox.ru/docs/integration-actions-react-native).

### Embedded Blocks

`MindboxEmbeddedBlock` shows the block configured for a place in the admin panel. Give it the
place's system name and a height; the layout sets its position and width.

```tsx
import { MindboxEmbeddedBlock } from 'mindbox-sdk';

<MindboxEmbeddedBlock
  placeSystemName="stories"
  height={104}
  active={useIsFocused()}
  placeholder={<StoriesSkeleton />}
  error={<StoriesUnavailable />}
  onFail={(reason) => console.log(`stories failed: ${reason}`)}
/>
```

- `onLoad`, `onEmpty` and `onFail` report how the load ended. Keep the block in the layout after
  `onEmpty`: a collapsed block still shows content the place gets later.
- Pass `active` from your navigation (`useIsFocused()` in React Navigation). Screens under the top
  one stay in the native window, and a block there would spend its `timeoutMs`, 30 seconds by
  default, while nobody sees it.
- `loadingStrategy` sets what the block shows while it loads. The default, `automatic`, keeps the
  block at zero height at a place that has not shown content on this device yet, and at a place
  that has, takes the height a frame after mounting. `placeholder` takes it from the first frame.
- `timeoutMs`, `loadingStrategy` and `animatesReveal` are read only when the block is created; give
  the component a new `key` to change them. `height` can change at any time.
- The block works on iOS and Android. On other platforms it collapses and reports `onFail` with
  `internalError`.

### Push Notifications

Mindbox SDK aids in handling push notifications. It offers configurations and usage instructions, found in the SDK documentation [Android(FCM)](https://developers.mindbox.ru/docs/firebase-send-push-notifications-react-native), [Android(HCM)](https://developers.mindbox.ru/docs/huawei-send-push-notifications-react-native), [IOS](https://developers.mindbox.ru/docs/ios-send-push-notifications-react-native) and [IOS(Rich)](https://developers.mindbox.ru/docs/ios-send-rich-push-react-native).

## Troubleshooting

Feel free to refer to the [Example of integration](https://github.com/mindbox-cloud/react-native-sdk/tree/develop/example) in case of any issues.

## Further Help

If you need further assistance, don't hesitate to contact us.

## License

This library is open source, available under the explicit terms of the [License](https://github.com/mindbox-cloud/react-native-sdk/blob/master/LICENSE.md).

For a comprehensive understanding, we recommend reading the Mindbox [React Native SDK](https://developers.mindbox.ru/docs/react-native-sdk-integration) documentation.
