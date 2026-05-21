# Migration Guide from 2.x.x to 3.0.0

Mindbox SDK 3.0 adds support for React Native New Architecture and no longer supports the old React Native architecture.

This guide describes the required changes when migrating from Mindbox SDK 2.x.x to 3.x.x
## Requirements

- React Native `>=0.76.0`
- React `>=18.0.0`
- React Native New Architecture enabled
- Android min SDK `24`
- iOS `15.1`

## Breaking Changes

### React Native

- The SDK now requires React Native New Architecture.
- The minimum supported React Native version has been raised to `>=0.76.0`.
- The minimum supported React version has been raised to `>=18.0.0`.
- The SDK now uses TurboModule/codegen integration through `NativeMindboxSdk`.
- Deprecated JS APIs have been removed:
  - `getToken`
  - `updateToken`
  - `updateNotificationPermissionStatus`

### Android

- The SDK no longer supports the old React Native architecture. If `newArchEnabled=false`, the build fails.
- `MindboxJsDelivery` is now a Kotlin `object`.
- `MindboxJsDelivery.Shared.getInstance(context)` has been removed.
- Client integrations that pass `Context` or `ReactContext` to `MindboxJsDelivery` must be migrated.
- The minimum Android SDK version has been raised from `21` to `24`.

### iOS

- The SDK no longer supports the old React Native architecture. If `RCT_NEW_ARCH_ENABLED != 1`, the build fails.
- The minimum iOS version has been raised from `12.0` to `15.1`.
- Manual calls to `MindboxJsDelivery` from client code are no longer required.

## React Native API Migration

### `getToken`

`getToken` has been removed. Use `getTokens` instead. The method returns push tokens collected by the SDK.

Before:

```typescript
MindboxSdk.getToken((token: string) => {
  // Use FCM/APNS token
})
```

After:

```typescript
MindboxSdk.getTokens((tokens: string) => {
  // Use push tokens returned by the SDK
})
```

### `updateToken`

`updateToken` has been removed. Use native Mindbox SDK methods to pass push tokens.

Android:

```kotlin

Mindbox.updatePushToken(context, token)
```

iOS:

```swift
Mindbox.shared.apnsTokenUpdate(deviceToken: deviceToken)
```

### `updateNotificationPermissionStatus`

`updateNotificationPermissionStatus` has been removed. Use `refreshNotificationPermissionStatus` instead.

Before:

```typescript
MindboxSdk.updateNotificationPermissionStatus(granted)
```

After:

```typescript
MindboxSdk.refreshNotificationPermissionStatus()
```

## Android Migration

Choose one of the options below. Option 1 is recommended.

### Option 1. Simplified Integration With Auto Init

Add the following metadata to the `application` block in `android/app/src/main/AndroidManifest.xml`:

```xml
<meta-data
  android:name="com.mindbox.sdk.AUTO_INIT_ENABLED"
  android:value="true" />
```

Remove Mindbox client integration code from `MainActivity` and `MainApplication`.

In particular, remove manual code that:

- initializes or stores `MindboxJsDelivery`;
- calls `MindboxJsDelivery.Shared.getInstance(context)`;
- passes `ReactContext` to Mindbox push-click handling;
- manually calls `Mindbox.initPushServices(...)` only for React Native lifecycle integration.

After this change, the SDK handles React Native push-click delivery internally.

### Option 2. Simplified Integration Without AndroidManifest Changes

If you do not want to add `AUTO_INIT_ENABLED` to `AndroidManifest.xml`, remove Mindbox-specific code from `MainActivity` and update `MainApplication`.

Before:

```kotlin
Mindbox.initPushServices(
    this,
    listOf(MindboxFirebase, MindboxHuawei, MindboxRuStore)
)
```

After:

```kotlin
import com.mindboxsdk.initPushServicesForReactNative

Mindbox.initPushServicesForReactNative(
    this,
    listOf(MindboxFirebase, MindboxHuawei, MindboxRuStore)
)
```

This initializes push services and registers the React Native lifecycle listener required by the SDK.

### Option 3. Manual MainActivity Migration

If you need to keep manual push-click handling in `MainActivity`, update the integration to the new `MindboxJsDelivery` API.

Before:

```kotlin
private var jsDelivery: MindboxJsDelivery? = null

private fun initializeAndSendIntent(context: ReactContext) {
    jsDelivery = MindboxJsDelivery.Shared.getInstance(context)
    jsDelivery?.sendPushClicked(intent)
}
```

After:

```kotlin
class MainActivity : ReactActivity() {
    private fun handlePushIntent(intent: Intent) {
        Mindbox.onNewIntent(intent)
        Mindbox.onPushClicked(applicationContext, intent)
        MindboxJsDelivery.sendPushClicked(intent)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handlePushIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handlePushIntent(intent)
    }
}
```

## iOS Migration

Existing iOS integrations can continue to work after enabling React Native New Architecture and updating the minimum iOS version. However, the recommended approach is to simplify `AppDelegate` and let the SDK handle notification delivery.

### Recommended Simplified Integration

Keep only the Mindbox-related code shown below in `AppDelegate`.

All other Mindbox code in `AppDelegate` can be removed, including direct calls to `MindboxJsDelivery`.

Add SDK configuration during application startup:

```swift
@main
class AppDelegate: RCTAppDelegate, UNUserNotificationCenterDelegate {
    override func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        ....
        ....
        // Set the notification center delegate before configuring Mindbox.
        // MindboxApp.configure reads the current delegate during setup.
        UNUserNotificationCenter.current().delegate = self
        MindboxApp.configure(launchOptions: launchOptions)
        ....
    }
}
```

Warning: if your app calls `MindboxJsDelivery` or `MindboxJSDelivery` directly, remove that code. Manual calls are no longer required. Push-click and in-app event delivery are handled by the SDK.

## Migration Checklist

- Enable React Native New Architecture.
- Update React Native to `>=0.76.0`.
- Update React to `>=18.0.0`.
- Update Android min SDK to `24`.
- Update iOS deployment target to `15.1`.
- Remove usages of `getToken`.
- Replace `getToken` with `getTokens`.
- Remove usages of `updateToken`.
- Replace `updateNotificationPermissionStatus` with `refreshNotificationPermissionStatus`.
- Migrate Android push-click integration to one of the supported options.
- Remove direct `MindboxJsDelivery` calls from iOS client code.
