package com.mindboxsdk

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.turbomodule.core.interfaces.TurboModule
import com.facebook.react.uimanager.ViewManager
import com.mindboxsdk.embedded.MindboxEmbeddedBlockViewManager

class MindboxSdkPackage : TurboReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
        if (name == NativeMindboxSdkSpec.NAME) MindboxSdkModule(reactContext) else null

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
        mapOf(
            NativeMindboxSdkSpec.NAME to ReactModuleInfo(
                NativeMindboxSdkSpec.NAME,
                MindboxSdkModule::class.java.name,
                false,
                false,
                false,
                TurboModule::class.java.isAssignableFrom(MindboxSdkModule::class.java)
            )
        )
    }

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        emptyList()

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
        listOf(MindboxEmbeddedBlockViewManager())
}
