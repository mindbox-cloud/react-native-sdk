package com.exampleapp

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.turbomodule.core.interfaces.TurboModule

class NotificationPackage : TurboReactPackage() {

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return if (name == NativeNotificationModuleSpec.NAME) {
            NotificationModule(reactContext)
        } else {
            null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                NativeNotificationModuleSpec.NAME to ReactModuleInfo(
                    NativeNotificationModuleSpec.NAME,
                    NativeNotificationModuleSpec.NAME,
                    false,
                    false,
                    false,
                    false,
                    TurboModule::class.java.isAssignableFrom(NotificationModule::class.java)
                )
            )
        }
    }
}
