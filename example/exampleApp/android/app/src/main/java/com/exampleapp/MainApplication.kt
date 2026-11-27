package com.exampleapp

import android.app.Application
import android.content.Context
import android.content.SharedPreferences
import android.os.Handler
import android.os.Looper
import android.util.Log
import cloud.mindbox.mobile_sdk.pushes.MindboxRemoteMessage
import cloud.mindbox.mindbox_firebase.MindboxFirebase
import cloud.mindbox.mindbox_huawei.MindboxHuawei
import cloud.mindbox.mobile_sdk.Mindbox
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.exampleapp.NotificationPackage
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import cloud.mindbox.mindbox_rustore.MindboxRuStore
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

    override val reactHost: ReactHost by lazy {
        getDefaultReactHost(
            context = applicationContext,
            packageList =
                PackageList(this).packages.apply {
                    add(NotificationPackage())
                },
        )
    }

    override fun onCreate() {
        super.onCreate()
        //The fifth step of https://developers.mindbox.ru/docs/firebase-send-push-notifications-react-native
        Mindbox.initPushServices(this, listOf(MindboxFirebase, MindboxHuawei, MindboxRuStore))
        loadReactNative(this)
    }

    private val gson = Gson()

    fun saveNotification(message: MindboxRemoteMessage) {
        val sharedPreferences = getSharedPreferences("notifications", Context.MODE_PRIVATE)
        val editor = sharedPreferences.edit()
        val notificationsJson = sharedPreferences.getString("notifications", "[]")
        val type = object : TypeToken<MutableList<String>>() {}.type
        val notifications: MutableList<String> = gson.fromJson(notificationsJson, type)
        notifications.add(gson.toJson(message))
        editor.putString("notifications", gson.toJson(notifications))
        editor.apply()
        notifyJS()
    }

    private fun notifyJS() {
        val handler = Handler(Looper.getMainLooper())
        handler.post {
            try {
                reactHost.currentReactContext
                    ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit("newNotification", null)
            } catch (e: Exception) {
                Log.e("MainApplication", "Error notifying React Native", e)
            }
        }
    }
}
