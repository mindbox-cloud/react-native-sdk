package com.mindboxsdk

import android.content.Intent
import android.os.Bundle
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import org.json.JSONObject
import kotlin.properties.Delegates
import cloud.mindbox.mobile_sdk.Mindbox
import cloud.mindbox.mobile_sdk.logger.Level

class MindboxJsDelivery private constructor(private val mReactContext: ReactContext) {
  companion object Shared {
    private var INSTANCE: MindboxJsDelivery? = null
    private var delayedIntent: Intent? = null

    var hasListeners: Boolean by Delegates.observable(false) { _, _, newValue ->
      if (newValue) {
        delayedIntent?.let {
            it.extras?.let {
                Mindbox.writeLog("[RN] Send push data from delayed ${it}", Level.INFO)
            }
            INSTANCE?.sendPushClicked(it)
        }
      }
      delayedIntent = null
    }

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

  private fun sendEvent(eventName: String, bundle: Bundle) {
    if (mReactContext.hasActiveCatalystInstance()) {
      var payload = JSONObject();
      payload.put("pushUrl", bundle.getString("push_url", ""));
      payload.put("pushPayload", bundle.getString("push_payload", ""));
      Mindbox.writeLog("[RN] Send push data to listener with ${payload.toString()}", Level.INFO)
      mReactContext
        .getJSModule(RCTDeviceEventEmitter::class.java)
        .emit(eventName, payload.toString())
    }
  }

  fun sendPushClicked(intent: Intent) {
    if (hasListeners) {
      val bundle = intent.extras
      if (bundle != null) {
        val key = bundle.getString("uniq_push_key")
        if (key != null) {
          sendEvent("pushNotificationClicked", bundle)
        } else {
          Mindbox.writeLog("[RN] Push was received without uniq_push_key it is not our push", Level.INFO)
        }
      }
    } else {
      delayedIntent = intent
    }
  }
}
