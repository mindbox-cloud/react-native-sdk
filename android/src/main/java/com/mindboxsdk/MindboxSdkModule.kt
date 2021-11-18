package com.mindboxsdk

import android.app.Activity
import android.content.Context
import android.os.Handler
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

import cloud.mindbox.mobile_sdk.Mindbox
import cloud.mindbox.mobile_sdk.MindboxConfiguration
import com.facebook.react.bridge.Promise
import org.json.JSONObject

class MindboxSdkModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  private var deviceUuidSubscription: String? = null
  private var fmsTokenSubscription: String? = null

  override fun getName(): String {
    return "MindboxSdk"
  }

  @ReactMethod
  fun initialize(payloadString: String, promise: Promise) {
    try {
      val payload = JSONObject(payloadString)
      val context: Context = reactApplicationContext.applicationContext
      val activity: Activity? = reactApplicationContext.currentActivity

      if (activity != null && context != null) {
        val configurationBuilder = MindboxConfiguration.Builder(
          context = context,
          domain = payload.optString("domain", "api.mindbox.ru"),
          endpointId = payload.optString("endpointId", "")
        )
        configurationBuilder.subscribeCustomerIfCreated(payload.optBoolean("subscribeCustomerIfCreated", true))
        if (payload.has("shouldCreateCustomer")) {
          configurationBuilder.shouldCreateCustomer(payload.optBoolean("shouldCreateCustomer", true))
        }
        if (payload.has("previousInstallId")) {
          configurationBuilder.setPreviousInstallationId(payload.optString("previousInstallId", ""))
        }
        if (payload.has("previousUuid")) {
          configurationBuilder.setPreviousDeviceUuid(payload.optString("previousUuid", ""))
        }
        val configuration = configurationBuilder.build()

        val handler = Handler(context.mainLooper)
        handler.post(Runnable {
          Mindbox.init(activity, configuration)
        })

        promise.resolve(true)
      } else {
        promise.resolve(false)
      }
    } catch (error: Throwable) {
      promise.reject(error)
    }
  }

  @ReactMethod
  fun getDeviceUUID(promise: Promise) {
    try {
      if (this.deviceUuidSubscription != null) {
        Mindbox.disposeDeviceUuidSubscription(this.deviceUuidSubscription!!)
      }

      this.deviceUuidSubscription = Mindbox.subscribeDeviceUuid {
        deviceUUID -> promise.resolve(deviceUUID)
      }
    } catch (error: Throwable) {
      promise.reject(error)
    }
  }

  @ReactMethod
  fun getFMSToken(promise: Promise) {
    try {
      if (this.fmsTokenSubscription != null) {
        Mindbox.disposeFmsTokenSubscription(this.fmsTokenSubscription!!)
      }

      this.fmsTokenSubscription = Mindbox.subscribeFmsToken {
        fmsToken -> promise.resolve(fmsToken)
      }
    } catch (error: Throwable) {
      promise.reject(error)
    }
  }

  @ReactMethod
  fun updateFMSToken(token: String, promise: Promise) {
    try {
      Mindbox.updateFmsToken(reactApplicationContext.applicationContext, token)
      promise.resolve(true)
    } catch (error: Throwable) {
      promise.reject(error)
    }
  }

  @ReactMethod
  fun executeAsyncOperation(operationSystemName: String, operationBody: String, promise: Promise) {
    Mindbox.executeAsyncOperation(reactApplicationContext.applicationContext, operationSystemName, operationBody)
    promise.resolve(true)
  }

  @ReactMethod
  fun executeSyncOperation(operationSystemName: String, operationBody: String, promise: Promise) {
    Mindbox.executeSyncOperation(
      context = reactApplicationContext.applicationContext,
      operationSystemName = operationSystemName,
      operationBodyJson = operationBody,
      onSuccess = {
          response -> promise.resolve(response)
      },
      onError = {
          error -> promise.resolve(error.toJson())
      }
    )
  }
}
