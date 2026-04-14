
/**
 * Prebuilt TurboModule spec (react-native-codegen). Regenerate when JS Spec changes.
 *
 * @nolint
 */

package com.mindboxsdk;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import javax.annotation.Nonnull;

public abstract class NativeMindboxSdkSpec extends ReactContextBaseJavaModule implements TurboModule {
  public static final String NAME = "MindboxSdk";

  public NativeMindboxSdkSpec(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public @Nonnull String getName() {
    return NAME;
  }

  protected final void emitOnPushNotificationClicked(ReadableMap value) {
    mEventEmitterCallback.invoke("onPushNotificationClicked", value);
  }

  protected final void emitOnInAppClick(ReadableMap value) {
    mEventEmitterCallback.invoke("onInAppClick", value);
  }

  protected final void emitOnInAppDismiss(ReadableMap value) {
    mEventEmitterCallback.invoke("onInAppDismiss", value);
  }

  @ReactMethod
  @DoNotStrip
  public abstract void initialize(String payloadString, Promise promise);

  @ReactMethod
  @DoNotStrip
  public abstract void registerCallbacks(ReadableArray callbacks);

  @ReactMethod
  @DoNotStrip
  public abstract void getDeviceUUID(Promise promise);

  @ReactMethod
  @DoNotStrip
  public abstract void getFMSToken(Promise promise);

  @ReactMethod
  @DoNotStrip
  public abstract void getTokens(Promise promise);

  @ReactMethod
  @DoNotStrip
  public abstract void updateFMSToken(String token, Promise promise);

  @ReactMethod
  @DoNotStrip
  public abstract void executeAsyncOperation(String operationSystemName, String operationBody, Promise promise);

  @ReactMethod
  @DoNotStrip
  public abstract void executeSyncOperation(String operationSystemName, String operationBody, Promise promise);

  @ReactMethod
  @DoNotStrip
  public abstract void onPushClickedIsRegistered(boolean isRegistered);

  @ReactMethod
  @DoNotStrip
  public abstract void setLogLevel(double level);

  @ReactMethod
  @DoNotStrip
  public abstract void getSdkVersion(Promise promise);

  @ReactMethod
  @DoNotStrip
  public abstract void pushDelivered(String uniqKey);

  @ReactMethod
  @DoNotStrip
  public abstract void refreshNotificationPermissionStatus();

  @ReactMethod
  @DoNotStrip
  public abstract void writeNativeLog(String message, double logLevel);
}
