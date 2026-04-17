package com.exampleapp

import android.content.Context
import android.content.Intent
import android.os.Bundle
import cloud.mindbox.mobile_sdk.Mindbox
import cloud.mindbox.mobile_sdk.logger.Level
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactHost
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ReactContext
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.mindboxsdk.MindboxJsDelivery

class MainActivity : ReactActivity() {

    private var jsDelivery: MindboxJsDelivery? = null

    private fun sendIntent(context: Context, intent: Intent) {
        Mindbox.onNewIntent(intent)
        Mindbox.onPushClicked(context, intent)
        jsDelivery?.sendPushClicked(intent)
    }

    private fun initializeAndSentIntent(context: ReactContext) {
        jsDelivery = MindboxJsDelivery.Shared.getInstance(context)

        if (context.hasCurrentActivity()) {
            sendIntent(context, context.currentActivity!!.intent)
        } else {
            sendIntent(context, this.getIntent())
        }
    }

    override fun getMainComponentName(): String = "exampleApp"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            Mindbox.writeLog("[RN][exampleApp] New arch enabled", Level.DEBUG)
            val reactHost: ReactHost = reactActivityDelegate.reactHost
            val context: ReactContext? = reactHost.currentReactContext as? ReactContext
            if (context != null) {
                Mindbox.writeLog("[RN][exampleApp] ReactContext available on start", Level.DEBUG)
                initializeAndSentIntent(context)
            } else {
                reactHost.addReactInstanceEventListener(object :
                    ReactInstanceManager.ReactInstanceEventListener {
                    override fun onReactContextInitialized(context: ReactContext) {
                        Mindbox.writeLog("[RN][exampleApp] ReactContext available on listener", Level.DEBUG)
                        initializeAndSentIntent(context)
                        reactHost.removeReactInstanceEventListener(this)
                    }
                })
            }
        } else {
            Mindbox.writeLog("[RN][exampleApp] Old architecture", Level.DEBUG)
            val reactInstanceManager: ReactInstanceManager = getReactNativeHost().reactInstanceManager
            val reactContext: ReactContext? = reactInstanceManager.getCurrentReactContext()
            if (reactContext != null) {
                initializeAndSentIntent(reactContext)
                Mindbox.writeLog("[RN][exampleApp] ReactContext available on start", Level.DEBUG)
            } else {
                reactInstanceManager.addReactInstanceEventListener(object :
                    ReactInstanceManager.ReactInstanceEventListener {
                    override fun onReactContextInitialized(context: ReactContext) {
                        initializeAndSentIntent(context)
                        reactInstanceManager.removeReactInstanceEventListener(this)
                    }
                })
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        sendIntent(this, intent)
    }
}
