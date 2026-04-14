package com.mindboxsdk

internal fun interface MindboxEventSubscriber {
    fun onEvent(event: MindboxSdkLifecycleEvent)
}
