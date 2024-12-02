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
import com.facebook.react.ReactHost
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {}
            override fun getJSMainModuleName(): String = "index"
            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
        }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(this.applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        //The fifth step of https://developers.mindbox.ru/docs/firebase-send-push-notifications-react-native
        Mindbox.initPushServices(this, listOf(MindboxFirebase, MindboxHuawei))
        SoLoader.init(this, false)
    }

}
