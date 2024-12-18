package com.exampleapp

import android.content.Context
import android.util.Log
import android.os.Handler
import android.os.Looper
import cloud.mindbox.mobile_sdk.pushes.MindboxRemoteMessage
import cloud.mindbox.mindbox_firebase.MindboxFirebase
import cloud.mindbox.mindbox_huawei.MindboxHuawei
import cloud.mindbox.mobile_sdk.Mindbox
import com.facebook.react.PackageList
import com.facebook.react.ReactPackage
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.reactnativenavigation.NavigationApplication
import com.reactnativenavigation.react.NavigationReactNativeHost

class MainApplication : NavigationApplication() {

    private val gson = Gson()

    override val reactNativeHost: NavigationReactNativeHost = object : NavigationReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> {
            return PackageList(this).packages.apply {
                add(NotificationPackage())
            }
        }

        override fun getJSMainModuleName(): String {
            return "index"
        }

        override fun getUseDeveloperSupport(): Boolean {
           return  BuildConfig.DEBUG
        }
    }

    override fun onCreate() {
        super.onCreate()
        // Mindbox initialization
        Mindbox.initPushServices(this, listOf(MindboxFirebase, MindboxHuawei))
    }

}
