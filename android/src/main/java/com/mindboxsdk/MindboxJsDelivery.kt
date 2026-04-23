package com.mindboxsdk

import android.content.Intent
import android.os.Bundle
import cloud.mindbox.mobile_sdk.Mindbox
import cloud.mindbox.mobile_sdk.logger.Level
import kotlin.properties.Delegates

object MindboxJsDelivery {
    private var delayedIntent: Intent? = null

    internal var hasListeners: Boolean by Delegates.observable(false) { _, _, newValue ->
        Mindbox.writeLog("[RN][MindboxJsDelivery] hasListeners=$newValue", Level.DEBUG)
        if (newValue) {
            delayedIntent?.let { intent ->
                intent.extras?.let {
                    Mindbox.writeLog("[RN] Send push data from delayed ${it}", Level.INFO)
                }
                sendPushClicked(intent)
            }
        }
        delayedIntent = null
    }

    private fun sendEvent(eventName: String, bundle: Bundle) {
        Mindbox.writeLog("[RN][MindboxJsDelivery] sendEvent($eventName) push_url=${bundle.getString("push_url")}", Level.INFO)
        MindboxSdkModule.deliverPushNotificationClickedFromExternal(bundle)
    }

    /**
     * Sends a push-click intent to JS or delays it until listeners are registered.
     *
     * If no listeners are registered, the intent is cached and replayed later. Intents without
     * `uniq_push_key` are ignored.
     *
     * @param intent push-click intent to process
     */
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
