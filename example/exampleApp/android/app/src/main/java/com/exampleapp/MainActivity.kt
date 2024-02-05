package com.exampleapp

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ReactContext
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import cloud.mindbox.mobile_sdk.Mindbox
import android.content.Context
import android.content.Intent
import android.os.Bundle
import com.mindboxsdk.MindboxJsDelivery
import com.mindboxsdk.MindboxJsDelivery.Shared.getInstance

class MainActivity : ReactActivity() {
  private var mJsDelivery: MindboxJsDelivery? = null
  override fun getMainComponentName(): String = "exampleApp"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /// Initializes MindboxJsDelivery and sends the current intent to React Native
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
    val mReactInstanceManager = getReactNativeHost().getReactInstanceManager();
    val reactContext = mReactInstanceManager.getCurrentReactContext();

    // Initialize and send intent if React context is already available
    if (reactContext != null) {
      initializeAndSentIntent(reactContext);
    } else {
      // Add listener to initialize and send intent once React context is initialized
      mReactInstanceManager.addReactInstanceEventListener(object :
        ReactInstanceManager.ReactInstanceEventListener {
        override fun onReactContextInitialized(context: ReactContext) {
          initializeAndSentIntent(context)
          mReactInstanceManager.removeReactInstanceEventListener(this)
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
  private fun sendIntent(context: Context, intent: Intent) {
    Mindbox.onNewIntent(intent)
    //send click action
    Mindbox.onPushClicked(context, intent)
    mJsDelivery?.sendPushClicked(intent);
  }
}
