package com.exampleapp

import android.app.Application
import cloud.mindbox.mobile_sdk.Mindbox
import cloud.mindbox.mobile_sdk.pushes.MindboxRemoteMessage
import cloud.mindbox.mindbox_firebase.MindboxFirebase
import cloud.mindbox.mindbox_huawei.MindboxHuawei
import cloud.mindbox.mindbox_rustore.MindboxRuStore
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: DefaultReactNativeHost =
    object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> =
        PackageList(this).packages.apply {
          add(NotificationPackage())
        }

      override fun getJSMainModuleName(): String = "index"

      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

      override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED

      override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load()
    }
  }

  fun saveNotification(message: MindboxRemoteMessage) {
    NotificationStorage.saveNotification(this, message)
    NotificationModule.emitNotificationCenterUpdatedFromExternal()
  }
}
