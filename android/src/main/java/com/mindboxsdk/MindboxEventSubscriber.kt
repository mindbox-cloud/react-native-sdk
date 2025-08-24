package com.mindboxsdk

internal interface MindboxEventSubscriber {
    fun onEvent(event: MindboxSdkLifecyceEvent)
}
