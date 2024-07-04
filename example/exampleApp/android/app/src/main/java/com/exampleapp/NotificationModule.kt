package com.exampleapp

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NotificationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val sharedPreferences: SharedPreferences =
        reactContext.getSharedPreferences("notifications", Context.MODE_PRIVATE)

    override fun getName(): String {
        return "NotificationModule"
    }

    @ReactMethod
    fun addListener(eventName: String?) {
    }

    @ReactMethod
    fun removeListeners(count: Integer?) {
    }

    @ReactMethod
    fun getNotifications(promise: Promise) {
        try {
            val notificationsJson = sharedPreferences.getString("notifications", "[]")
            promise.resolve(notificationsJson)
        } catch (e: Exception) {
            promise.reject("Error", e)
        }
    }

    @ReactMethod
    fun clearNotifications(promise: Promise) {
        try {
            val editor = sharedPreferences.edit()
            editor.putString("notifications", "[]")
            editor.apply()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("Error", e)
        }
    }
}
