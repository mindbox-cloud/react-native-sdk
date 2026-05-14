package com.exampleapp

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = NativeNotificationModuleSpec.NAME)
class NotificationModule(
    private val reactContext: ReactApplicationContext
) : NativeNotificationModuleSpec(reactContext) {

    companion object {
        @Volatile
        private var activeModule: NotificationModule? = null

        fun emitNotificationCenterUpdatedFromExternal() {
            activeModule?.emitNotificationCenterUpdated()
        }
    }

    init {
        activeModule = this
    }

    @ReactMethod
    override fun getNotifications(promise: Promise) {
        try {
            val notificationsJson: String = NotificationStorage.getNotificationsJson(reactContext)
            promise.resolve(notificationsJson)
        } catch (error: Throwable) {
            promise.reject("Error", error)
        }
    }

    @ReactMethod
    override fun clearNotifications(promise: Promise) {
        try {
            NotificationStorage.clearNotifications(reactContext)
            promise.resolve(null)
        } catch (error: Throwable) {
            promise.reject("Error", error)
        }
    }

    override fun invalidate() {
        if (activeModule === this) {
            activeModule = null
        }
        super.invalidate()
    }

    private fun emitNotificationCenterUpdated() {
        emitOnNotificationCenterUpdated(Arguments.createMap())
    }
}
