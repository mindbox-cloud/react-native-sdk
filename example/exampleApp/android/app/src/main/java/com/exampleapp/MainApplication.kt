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
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.soloader.SoLoader
import com.exampleapp.NotificationPackage
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import cloud.mindbox.mindbox_rustore.MindboxRuStore
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost =
        object : ReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                    add(NotificationPackage())
                }
            override fun getJSMainModuleName(): String = "index"
            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
        }

    override fun onCreate() {
        super.onCreate()
        //The fifth step of https://developers.mindbox.ru/docs/firebase-send-push-notifications-react-native
        Mindbox.initPushServices(this, listOf(MindboxFirebase, MindboxHuawei, MindboxRuStore))
        SoLoader.init(this, false)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            load()
        }
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
                val reactInstanceManager = reactNativeHost.reactInstanceManager
                reactInstanceManager.currentReactContext
                    ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit("newNotification", null)
            } catch (e: Exception) {
                Log.e("MainApplication", "Error notifying React Native", e)
            }
        }
    }
}
