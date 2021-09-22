package com.mindboxsdk

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

import cloud.mindbox.mobile_sdk.*

class MindboxSdkModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return "MindboxSdk"
  }

  @ReactMethod
  fun initialize(mindbox_api: String, project_endpoint_external_id: String) {
    val context = reactContext.getApplicationContext()

    val configuration = MindboxConfiguration.Builder(
      context,
      mindbox_api,                     
      project_endpoint_external_id
    )
    .subscribeCustomerIfCreated(true) 
    .build()

    Mindbox.init(context, configuration)
  }
  
}
