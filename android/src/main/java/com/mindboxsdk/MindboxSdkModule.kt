package com.mindboxsdk

import android.app.Activity
import android.content.Context
import android.os.Handler
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

import cloud.mindbox.mobile_sdk.Mindbox
import cloud.mindbox.mobile_sdk.MindboxConfiguration

class MindboxSdkModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String {
    return "MindboxSdk"
  }

  @ReactMethod
  fun initialize(domain: String, endpoint: String) {
    val context: Context = reactApplicationContext.applicationContext
    val activity: Activity? = reactApplicationContext.currentActivity

    if (activity != null && context != null) {
      val configuration = MindboxConfiguration.Builder(
        context,
        domain,
        endpoint
      )
        .subscribeCustomerIfCreated(true)
        .build()

      val handler = Handler(context.mainLooper);
      handler.post(Runnable {
        Mindbox.init(activity, configuration)
      })
    }
  }
}
