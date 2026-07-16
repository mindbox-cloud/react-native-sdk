package com.mindboxsdk

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.os.Handler
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import cloud.mindbox.mobile_sdk.Mindbox
import cloud.mindbox.mobile_sdk.MindboxConfiguration
import cloud.mindbox.mobile_sdk.inapp.presentation.InAppCallback
import cloud.mindbox.mobile_sdk.inapp.presentation.callbacks.ComposableInAppCallback
import cloud.mindbox.mobile_sdk.inapp.presentation.callbacks.CopyPayloadInAppCallback
import cloud.mindbox.mobile_sdk.inapp.presentation.callbacks.DeepLinkInAppCallback
import cloud.mindbox.mobile_sdk.inapp.presentation.callbacks.EmptyInAppCallback
import cloud.mindbox.mobile_sdk.inapp.presentation.callbacks.LoggingInAppCallback
import cloud.mindbox.mobile_sdk.inapp.presentation.callbacks.UrlInAppCallback
import cloud.mindbox.mobile_sdk.logger.Level
import org.json.JSONObject

@ReactModule(name = NativeMindboxSdkSpec.NAME)
class MindboxSdkModule(
    private val reactContext: ReactApplicationContext
) : NativeMindboxSdkSpec(reactContext) {

    companion object {
        @Volatile
        private var activeModule: MindboxSdkModule? = null

        private fun setActiveModule(module: MindboxSdkModule) {
            activeModule = module
        }

        private fun clearActiveModule(module: MindboxSdkModule) {
            if (activeModule === module) {
                activeModule = null
            }
        }

        internal fun deliverPushNotificationClickedFromExternal(bundle: Bundle) {
            val module: MindboxSdkModule? = activeModule
            if (module != null) {
                module.emitPushFromDelivery(bundle)
            } else {
                Mindbox.writeLog("[RN][MindboxSdkModule] deliverPush: no active module, event skipped", Level.WARN)
            }
        }
    }

    init {
        setActiveModule(this)
    }

    private var deviceUuidSubscription: String? = null
    private var getTokensSubscription: String? = null

    private fun emitPushFromDelivery(bundle: Bundle) {
        val payload: WritableMap = Arguments.createMap().apply {
            putString("pushUrl", bundle.getString("push_url", ""))
            putString("pushPayload", bundle.getString("push_payload", ""))
        }
        emitOnPushNotificationClicked(payload)
    }

    override fun initialize(payloadString: String, promise: Promise) {
        try {
            val payload = JSONObject(payloadString)
            val context: Context = reactApplicationContext.applicationContext
            val activity: Activity? = reactApplicationContext.currentActivity
            if (activity != null) {
                val configurationBuilder = MindboxConfiguration.Builder(
                    context = context,
                    domain = payload.getString("domain"),
                    endpointId = payload.getString("endpointId")
                )
                if (payload.has("subscribeCustomerIfCreated")) {
                    configurationBuilder.subscribeCustomerIfCreated(
                        payload.optBoolean("subscribeCustomerIfCreated", false)
                    )
                }
                if (payload.has("shouldCreateCustomer")) {
                    configurationBuilder.shouldCreateCustomer(
                        payload.optBoolean("shouldCreateCustomer", true)
                    )
                }
                if (payload.has("previousInstallId")) {
                    configurationBuilder.setPreviousInstallationId(
                        payload.optString("previousInstallId", "")
                    )
                }
                if (payload.has("previousUuid")) {
                    configurationBuilder.setPreviousDeviceUuid(
                        payload.optString("previousUuid", "")
                    )
                }
                if (payload.has("operationsDomain")) {
                    configurationBuilder.operationsDomain(
                        payload.optString("operationsDomain", "")
                    )
                }
                val configuration = configurationBuilder.build()
                val handler = Handler(context.mainLooper)
                handler.post {
                    Mindbox.init(activity, configuration, listOf())
                }
                promise.resolve(true)
            } else {
                promise.resolve(false)
            }
        } catch (error: Throwable) {
            promise.reject(error)
        }
    }

    override fun registerCallbacks(callbacks: ReadableArray) {
        val cb = mutableListOf<InAppCallback>()
        for (i in 0 until callbacks.size()) {
            when (callbacks.getString(i)) {
                "urlInAppCallback" -> {
                    cb.add(UrlInAppCallback())
                    cb.add(DeepLinkInAppCallback())
                    cb.add(LoggingInAppCallback())
                }
                "copyPayloadInAppCallback" -> {
                    cb.add(CopyPayloadInAppCallback())
                    cb.add(LoggingInAppCallback())
                }
                "emptyInAppCallback" -> {
                    cb.add(EmptyInAppCallback())
                }
                else -> {
                    cb.add(object : InAppCallback {
                        override fun onInAppClick(id: String, redirectUrl: String, payload: String) {
                            val params = Arguments.createMap().apply {
                                putString("id", id)
                                putString("redirectUrl", redirectUrl)
                                putString("payload", payload)
                            }
                            emitOnInAppClick(params)
                        }
                        override fun onInAppDismissed(id: String) {
                            val params = Arguments.createMap().apply {
                                putString("id", id)
                            }
                            emitOnInAppDismiss(params)
                        }
                    })
                }
            }
        }
        Mindbox.registerInAppCallback(ComposableInAppCallback(cb))
    }

    override fun getDeviceUUID(promise: Promise) {
        try {
            if (deviceUuidSubscription != null) {
                Mindbox.disposeDeviceUuidSubscription(deviceUuidSubscription!!)
            }
            deviceUuidSubscription = Mindbox.subscribeDeviceUuid { deviceUUID ->
                promise.resolve(deviceUUID)
            }
        } catch (error: Throwable) {
            promise.reject(error)
        }
    }

    override fun getTokens(promise: Promise) {
        try {
            if (getTokensSubscription != null) {
                Mindbox.disposePushTokenSubscription(getTokensSubscription!!)
            }
            getTokensSubscription = Mindbox.subscribePushTokens { tokens ->
                promise.resolve(tokens)
            }
        } catch (error: Throwable) {
            promise.reject(error)
        }
    }

    override fun executeAsyncOperation(operationSystemName: String, operationBody: String, promise: Promise) {
        Mindbox.executeAsyncOperation(
            reactApplicationContext.applicationContext,
            operationSystemName,
            operationBody
        )
        promise.resolve(true)
    }

    override fun executeSyncOperation(operationSystemName: String, operationBody: String, promise: Promise) {
        Mindbox.executeSyncOperation(
            context = reactApplicationContext.applicationContext,
            operationSystemName = operationSystemName,
            operationBodyJson = operationBody,
            onSuccess = { response -> promise.resolve(response) },
            onError = { error -> promise.resolve(error.toJson()) }
        )
    }

    override fun onPushClickedIsRegistered(isRegistered: Boolean) {
        MindboxJsDelivery.hasListeners = isRegistered
    }

    override fun setLogLevel(level: Double) {
        val logLevel: Level = Level.values()[level.toInt()]
        Mindbox.setLogLevel(logLevel)
    }

    override fun getSdkVersion(promise: Promise) {
        try {
            promise.resolve(Mindbox.getSdkVersion())
        } catch (error: Throwable) {
            promise.reject(error)
        }
    }

    override fun pushDelivered(uniqKey: String) {
        Mindbox.onPushReceived(
            context = reactApplicationContext.applicationContext,
            uniqKey = uniqKey,
        )
    }

    override fun refreshNotificationPermissionStatus() {
        Mindbox.updateNotificationPermissionStatus(
            context = reactApplicationContext.applicationContext,
        )
    }

    override fun writeNativeLog(message: String, logLevel: Double) {
        val level: Level = Level.values()[logLevel.toInt()]
        Mindbox.writeLog(message, level)
    }

    override fun invalidate() {
        clearActiveModule(this)
        super.invalidate()
    }
}
