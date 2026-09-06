To run the example application with functioning mobile push notifications (complete only step 5 for in-app functionality to work), follow these steps:

1) Change the package identifier in the **app/build.gradle** file in Android
   Change team and bundle identifier and App Groups name in iOS for next targets:
    - exampleApp
    - MindboxNotificationServiceExtension
    - MindboxNotificationContentExtension

   Tip: app group name template: group.cloud.Mindbox.<your_bundle_id>

2) Add your application to either Firebase or Huawei project, following the instructions provided at:
   [Firebase Key Generation](https://developers.mindbox.ru/docs/firebase-get-keys) /
   [Huawei Key Generation](https://developers.mindbox.ru/docs/huawei-get-keys)
   or add app in your existing project for Android

   [Get keys and configuring APNS](https://developers.mindbox.ru/docs/ios-get-keys) for iOS

3) Copy the **google-services.json** file (for Firebase) or/and **agcconnect-services.json** file (for Huawei) into the app folder of your project

4) Configure your endpoints [iOS](https://developers.mindbox.ru/docs/add-ios-integration), [Android](https://developers.mindbox.ru/docs/add-android-integration)

5) Set your domain and endpoints in the HomeScreen.tsx within the configuration builder

6) Run the application

7) After 5 minutes check your user in your Mindbox admin site

8) Run in-app and send mobile push

## Embedded blocks

The app renders two embedded blocks on the **Embedded blocks** screen (a button on the home screen),
and the same two done wrong on **Embedded blocks: how not to**.

- `src/screens/EmbeddedBlocksScreen.tsx` — a `FlatList` with one block in `ListHeaderComponent` and
  another in `ListFooterComponent`, `active` taken from `useIsFocused()`, a host placeholder and a host
  error view. This is the code to copy.
- `src/screens/EmbeddedBlocksAntiPatternScreen.tsx` — the header handed over as an arrow function, a
  block inside `renderItem` of a virtualized list, no `active`. This is the code to recognize.
- Under every block there is a counter row, `mounted N · onLoad N · onFail N`. It turns red once the
  block has been built more than once — that is what a bad integration looks like. On the good screen
  it stays at `mounted 1 · onLoad 1` through scrolling, re-renders and screens opened on top.

Set the system names of your places in `src/utils/EmbeddedBlockPlaces.ts`; they come from the Mindbox
admin panel, the same way the endpoints do. A place the panel does not know simply collapses and
reports `onFail`.

The app takes the SDK from this repository (`"mindbox-sdk": "file:../.."`), not from npm, so the
embedded block is available before it is published. Run `yarn` in the repository root once — its
`prepare` step builds `lib/`, where TypeScript reads the package's types from — then `npm install`
here as usual. `metro.config.js` makes sure only one copy of React and React Native gets into the
bundle; an app that installs the package from npm needs none of that.

The rules behind the two screens — where a block may stand, what remounts it by accident, why
`active` matters — are in the [Embedded Blocks section](../../README.md#embedded-blocks) of the
package README.

### Local builds of the native SDKs

Both platforms take the native Mindbox SDK from the public repositories by default. To build against a
local checkout instead — the embedded block needs hooks that have not shipped yet — set an environment
variable:

```bash
MINDBOX_IOS_SDK_PATH=~/Documents/ios-sdk pod install
```

```bash
MINDBOX_ANDROID_SDK_VERSION=2.15.4-rn-local ./gradlew :app:installDebug
```

Without the variables nothing changes, as in an ordinary integration.
