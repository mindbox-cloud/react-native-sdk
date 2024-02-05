package com.exampleapp

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.flipper.ReactNativeFlipper
import com.facebook.soloader.SoLoader
import cloud.mindbox.mindbox_firebase.MindboxFirebase
import cloud.mindbox.mobile_sdk.Mindbox
import cloud.mindbox.mobile_sdk.pushes.MindboxPushService
import cloud.mindbox.mindbox_huawei.MindboxHuawei
import com.huawei.hms.push.*

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
    ReactNativeFlipper.initializeFlipper(this, reactNativeHost.reactInstanceManager)
  }
}
