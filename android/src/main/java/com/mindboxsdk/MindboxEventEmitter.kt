package com.mindboxsdk

import android.app.Activity
import android.app.Application
import android.content.Context
import android.content.Intent
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ReactContext
import com.facebook.react.ReactActivity
import cloud.mindbox.mobile_sdk.Mindbox
import cloud.mindbox.mobile_sdk.logger.Level

internal class MindboxEventEmitter (
    private val application: Application
) : MindboxEventSubscriber {

    private var jsDelivery: MindboxJsDelivery? = null

    override fun onEvent(event: MindboxSdkLifecyceEvent) {
        when (event) {
            is MindboxSdkLifecyceEvent.NewIntent -> handleNewIntent(event.reactContext, event.intent)
            is MindboxSdkLifecyceEvent.ActivityCreated -> handleActivityCreated(event.reactContext, event.activity)
            is MindboxSdkLifecyceEvent.ActivityDestroyed -> handleActivityDestroyed()
        }
    }

    private fun handleNewIntent(context: ReactContext, intent: Intent) {
        Mindbox.writeLog("[RN] Handle new intent in event emitter. ", Level.INFO)
        Mindbox.onNewIntent(intent)
        Mindbox.onPushClicked(context, intent)
        jsDelivery?.sendPushClicked(intent)
    }

    private fun handleActivityCreated(reactContext:ReactContext, activity: Activity) {
        Mindbox.writeLog("[RN] Handle activity created", Level.INFO)
        runCatching {
            reactContext.let { reactContext ->
                initializeAndSendIntent(reactContext, activity)
            }
        }
    }

    private fun initializeAndSendIntent(context: ReactContext, activity: Activity) {
        Mindbox.writeLog("[RN] Initialize MindboxJsDelivery", Level.INFO)
        jsDelivery = MindboxJsDelivery.Shared.getInstance(context)
        val currentActivity = context.currentActivity ?: activity
        currentActivity.intent?.let { handleNewIntent(context, it) }
    }

    private fun handleActivityDestroyed() {
        jsDelivery = null
    }
}
