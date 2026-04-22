package com.exampleapp

import android.content.Intent
import android.os.Bundle
import cloud.mindbox.mobile_sdk.Mindbox
import cloud.mindbox.mobile_sdk.logger.Level
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.mindboxsdk.MindboxJsDelivery

class MainActivity : ReactActivity() {
    private fun handlePushIntent(intent: Intent) {
        Mindbox.onNewIntent(intent)
        Mindbox.onPushClicked(applicationContext, intent)
        MindboxJsDelivery.sendPushClicked(intent)
    }

    override fun getMainComponentName(): String = "exampleApp"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            Mindbox.writeLog("[RN][exampleApp] New arch enabled", Level.DEBUG)
        } else {
            Mindbox.writeLog("[RN][exampleApp] Old architecture", Level.DEBUG)
        }
        handlePushIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handlePushIntent(intent)
    }
}
