package com.mindboxsdk

import android.content.Intent
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter

class MindboxJsDelivery private constructor(private val mReactContext: ReactContext) {
  companion object Shared {
    private var INSTANCE: MindboxJsDelivery? = null

    fun getInstance(reactContext: ReactContext): MindboxJsDelivery? {
      if (INSTANCE == null) {
        synchronized(MindboxJsDelivery::class.java) {
          if (INSTANCE == null) {
            INSTANCE = MindboxJsDelivery(reactContext)
          }
        }
      }

      return INSTANCE
    }
  }

  private fun sendEvent(eventName: String, params: Any?) {
    if (mReactContext.hasActiveCatalystInstance()) {
      mReactContext
        .getJSModule(RCTDeviceEventEmitter::class.java)
        .emit(eventName, params)
    }
  }

  fun sendPushClicked(intent: Intent) {
    val bundle = intent.extras
    if (bundle != null) {
      val key = bundle.getString("uniq_push_key")
      if (key != null) {
        sendEvent("pushNotificationClicked", bundle.getString("push_url"))
      }
    }
  }
}
