package com.exampleapp

import android.content.Context
import android.content.Intent
import android.os.Bundle
import cloud.mindbox.mobile_sdk.Mindbox
import com.facebook.react.bridge.ReactContext

import com.mindboxsdk.MindboxJsDelivery
import com.reactnativenavigation.NavigationActivity

class MainActivity : NavigationActivity() {
    private var mJsDelivery: MindboxJsDelivery? = null
    // Initializes MindboxJsDelivery and sends the current intent to React Native
    // https://developers.mindbox.ru/docs/flutter-push-navigation-react-native
    private fun initializeAndSentIntent(context: ReactContext) {
        mJsDelivery = MindboxJsDelivery.Shared.getInstance(context)
        if (context.hasCurrentActivity()) {
            sendIntent(context, context.getCurrentActivity()!!.getIntent())
        } else {
            sendIntent(context, this.getIntent())
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val reactInstanceManager = (application as MainApplication)
            .reactNativeHost
            .reactInstanceManager
        val reactContext = reactInstanceManager.currentReactContext

        // Initialize and send intent if React context is already available
        // https://developers.mindbox.ru/docs/flutter-push-navigation-react-native
        if (reactContext != null) {
            initializeAndSentIntent(reactContext);
        } else {
            // Add listener to initialize and send intent once React context is initialized
            reactInstanceManager.addReactInstanceEventListener(object :
                ReactInstanceManager.ReactInstanceEventListener {
                override fun onReactContextInitialized(context: ReactContext) {
                    initializeAndSentIntent(context)
                    reactInstanceManager.removeReactInstanceEventListener(this)
                }
            })
        }
    }

    // Handles new intents received by the activity
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        sendIntent(this, intent)
    }

    // Sends the received intent to Mindbox and React Native
    // https://developers.mindbox.ru/docs/android-get-click-react-native
    private fun sendIntent(context: Context, intent: Intent) {
        Mindbox.onNewIntent(intent)
        //send click action
        Mindbox.onPushClicked(context, intent)
        mJsDelivery?.sendPushClicked(intent);
    }
}
