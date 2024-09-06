package com.exampleapp

import android.content.Context
import android.content.Intent
import android.os.Bundle
import cloud.mindbox.mobile_sdk.Mindbox
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ReactContext
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.mindboxsdk.MindboxJsDelivery

class MainActivity : ReactActivity() {
    override fun getMainComponentName(): String = "exampleApp"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val mReactInstanceManager = getReactNativeHost().getReactInstanceManager();
        val reactContext = mReactInstanceManager.getCurrentReactContext();
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
    }
}
