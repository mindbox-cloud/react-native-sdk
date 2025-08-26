package com.mindboxsdk

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.ReactContext

internal sealed class MindboxSdkLifecycleEvent {
    data class NewIntent(val reactContext: ReactContext, val intent: Intent) : MindboxSdkLifecycleEvent()
    data class ActivityCreated(val reactContext: ReactContext, val activity: Activity) : MindboxSdkLifecycleEvent()
    data class ActivityDestroyed(val activity: Activity) : MindboxSdkLifecycleEvent()
}
