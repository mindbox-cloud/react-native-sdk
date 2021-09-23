package com.mindboxsdk

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

import cloud.mindbox.mobile_sdk.*

class MindboxSdkModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  val context = reactContext.getApplicationContext()

  override fun getName(): String {
    return "MindboxSdk"
  }

  @ReactMethod
  fun initialize(domain: String, endpoint: String) {
    val configuration = MindboxConfiguration.Builder(
      context,
      domain,                     
      endpoint
    )
    .subscribeCustomerIfCreated(true) 
    .build()

    Mindbox.init(context, configuration)
  }
  
}
