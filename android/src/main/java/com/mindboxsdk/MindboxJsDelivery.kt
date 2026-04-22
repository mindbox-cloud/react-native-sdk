package com.mindboxsdk

import android.content.Intent
import android.os.Bundle
import com.facebook.react.bridge.ReactContext
import kotlin.properties.Delegates
import cloud.mindbox.mobile_sdk.Mindbox
import cloud.mindbox.mobile_sdk.logger.Level

class MindboxJsDelivery private constructor(private val mReactContext: ReactContext) {
    companion object Shared {
        private var INSTANCE: MindboxJsDelivery? = null
        private var delayedIntent: Intent? = null

        var hasListeners: Boolean by Delegates.observable(false) { _, _, newValue ->
            Mindbox.writeLog("[RN][MindboxJsDelivery] hasListeners=$newValue", Level.DEBUG)
            if (newValue) {
                delayedIntent?.let { intent ->
                    intent.extras?.let {
                        Mindbox.writeLog("[RN] Send push data from delayed ${it}", Level.INFO)
                    }
                    INSTANCE?.sendPushClicked(intent)
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
        Mindbox.writeLog("[RN][MindboxJsDelivery] sendEvent($eventName) push_url=${bundle.getString("push_url")}", Level.INFO)
        MindboxSdkModule.deliverPushNotificationClickedFromExternal(bundle)
    }

    fun sendPushClicked(intent: Intent) {
        if (hasListeners) {
            val bundle = intent.extras
            if (bundle != null) {
                val key = bundle.getString("uniq_push_key")
                if (key != null) {
                    sendEvent("pushNotificationClicked", bundle)
                } else {
                    Mindbox.writeLog("[RN] Push without uniq_push_key — ignored", Level.INFO)
                }
            }
        } else {
            delayedIntent = intent
        }
    }
}
