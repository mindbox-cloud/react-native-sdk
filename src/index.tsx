import type { InitializationData, ExecuteSyncOperationPayload, ExecuteAsyncOperationPayload } from './types'
import type { InAppCallback } from './InAppCallback'
import MindboxSdkNative from './NativeMindboxSdk'

import { LogLevel } from './LogLevel'

type RemovableSubscription = {
  remove(): void
}

type InAppClickEventPayload = {
  id: string
  redirectUrl: string
  payload: string
}

type InAppDismissEventPayload = {
  id: string
}

type PushNotificationClickedPayload = {
  pushUrl: string
  pushPayload: string
}

class MindboxSdkClass {
  private _initialized: boolean
  private _initializing: boolean
  private _callbacks: Array<() => void>
  private _pushSubscription?: RemovableSubscription
  private _inAppClickSubscription?: RemovableSubscription
  private _inAppDismissSubscription?: RemovableSubscription
  private readonly _prefix: string = '[RN]'

  constructor() {
    this._initialized = false
    this._initializing = false
    this._callbacks = []
  }

  get initialized() {
    return this._initialized
  }

  get subscribedForPushClickedEvent() {
    return !!this._pushSubscription
  }

  public registerInAppCallbacks(callbacks: Array<InAppCallback>) {
    this._inAppClickSubscription?.remove()
    this._inAppDismissSubscription?.remove()
    this._inAppClickSubscription = undefined
    this._inAppDismissSubscription = undefined

    let customCallback: InAppCallback | undefined
    const callbackNames = callbacks.map((callback) => {
      const name = callback.getName()
      switch (name) {
        case 'urlInAppCallback':
        case 'copyPayloadInAppCallback':
        case 'emptyInAppCallback':
          break
        default:
          customCallback = callback
      }
      return name
    })

    this._inAppClickSubscription = MindboxSdkNative.onInAppClick((event: InAppClickEventPayload) => {
      customCallback?.onInAppClick(event.id, event.redirectUrl, event.payload)
    })
    this._inAppDismissSubscription = MindboxSdkNative.onInAppDismiss((event: InAppDismissEventPayload) => {
      customCallback?.onInAppDismissed(event.id)
    })

    MindboxSdkNative.registerCallbacks(callbackNames)
  }

  /**
   * @name initialize
   * @description Initialization of MindboxSdk. It is recommended to do this on app's launch. You can call this method multiple times to set new configuration params.
   * @param {InitializationData} initializationData Initialization data
   *
   * @example
   * await MindboxSdk.initialize({
   *   domain: 'your-domain.example.com',
   *   endpointId: 'your-endpoint-id-here',
   *   subscribeCustomerIfCreated: true,
   *   shouldCreateCustomer: true,
   *   previousInstallId: '',
   *   previousUuid: '',
   *   operationsDomain: 'anonymizer.example.com',
   *   shouldIncludeVersionCode: false,
   * });
   */
  public async initialize(initializationData: InitializationData) {
    if (this._initializing) {
      console.warn('MindboxSdk is already initializing')
      return
    }

    this._initializing = true

    if (!initializationData || typeof initializationData !== 'object') {
      this._initializing = false
      throw new Error('Wrong initialization data!')
    }

    const { domain, endpointId, subscribeCustomerIfCreated, shouldCreateCustomer, previousInstallId, previousUuid, operationsDomain, shouldIncludeVersionCode } = initializationData

    if (!domain || !endpointId) {
      this._initializing = false
      throw new Error('Wrong initialization data!')
    }

    const payload: InitializationData = {
      domain,
      endpointId,
    }

    if (typeof shouldCreateCustomer !== 'undefined') {
      payload.shouldCreateCustomer = shouldCreateCustomer
    }

    if (typeof subscribeCustomerIfCreated !== 'undefined') {
      payload.subscribeCustomerIfCreated = subscribeCustomerIfCreated
    }

    if (typeof previousInstallId !== 'undefined' && previousInstallId.length > 0) {
      payload.previousInstallId = previousInstallId
    }

    if (typeof previousUuid !== 'undefined' && previousUuid.length > 0) {
      payload.previousUuid = previousUuid
    }

    if (typeof operationsDomain !== 'undefined' && operationsDomain.length > 0) {
      payload.operationsDomain = operationsDomain
    }

    if (typeof shouldIncludeVersionCode !== 'undefined') {
      payload.shouldIncludeVersionCode = shouldIncludeVersionCode
    }

    try {
      const payloadString = JSON.stringify(payload)
      this._initialized = await MindboxSdkNative.initialize(payloadString)
      this._initializing = false
      this.writeNativeLog('Init in RN ', LogLevel.INFO)

      for (let i = 0; i < this._callbacks.length; i++) {
        this._callbacks[i]()
      }

      this._callbacks = []
    } catch (error) {
      this._initializing = false
      throw error
    }
  }

  /**
   * @name getDeviceUUID
   * @description Requires a callback that will return device UUID.
   * @param {function(deviceUUID: String): void} callback Callback will return device UUID
   *
   * @example
   * MindboxSdk.getDeviceUUID((uuid: string) => { ... });
   */
  public getDeviceUUID(callback: (deviceUUID: string) => void) {
    if (!callback || typeof callback !== 'function') {
      throw new Error('callback is required!')
    }

    const callbackHandler = () => {
      MindboxSdkNative.getDeviceUUID().then((deviceUUID: string) => callback(deviceUUID))
    }

    if (this._initialized) {
      callbackHandler()
    } else {
      this._callbacks.push(callbackHandler)
    }
  }

  /**
   * @name getTokens
   * @description Requires a callback that will return FMS (Android) / APNS (iOS) token .
   * method return jsin string like {"FCM":"token1","HMS":"token2","RuStore":"token3"}
   * @param {function(token: String): void} callback Callback will return FMS/HCM/RuStore (Android) / APNS (iOS) token
   * @example
   * MindboxSdk.getTokens((token: string) => { ... });
   */
  public getTokens(callback: (token: string) => void) {
    if (!callback || typeof callback !== 'function') {
      throw new Error('callback is required!')
    }

    const callbackHandler = () => {
      MindboxSdkNative.getTokens().then((token: string) => callback(token))
    }

    if (this._initialized) {
      callbackHandler()
    } else {
      this._callbacks.push(callbackHandler)
    }
  }

  /**
   * @name onPushClickReceived
   * @description Listens if push notification or push notification button were pressed.
   * @param {function(pushUrl: String, pushPayload: String): void} callback Callback will return push notification link or push notification button link
   *
   * @example
   * MindboxSdk.onPushClickReceived((pushClickRecievedData: string) => { ... });
   */
  public onPushClickReceived(callback: (pushUrl: string | null, pushPayload: string | null) => void) {
    if (!callback || typeof callback !== 'function') {
      this.writeNativeLog('PushClick callback is not set', LogLevel.ERROR)
      throw new Error('callback is required!')
    }

    this.removeOnPushClickReceived()
    this.writeNativeLog('Set push click listener', LogLevel.INFO)

    this._pushSubscription = MindboxSdkNative.onPushNotificationClicked((event: PushNotificationClickedPayload) => {
      callback(event.pushUrl || null, event.pushPayload || null)
    })

    this.writeNativeLog('Register push click listener', LogLevel.INFO)
    MindboxSdkNative.onPushClickedIsRegistered(true)
  }

  /**
   * @name removeOnPushClickReceived
   * @description Removes onPushClickReceived subscribtion and event listener.
   *
   * @example
   * MindboxSdk.removeOnPushClickReceived();
   */
  public removeOnPushClickReceived() {
    if (this._pushSubscription) {
      this._pushSubscription.remove()
      this._pushSubscription = undefined
      MindboxSdkNative.onPushClickedIsRegistered(false)
    }
  }

  /**
   * @name executeAsyncOperation
   * @description Makes request to backend API without waiting any response.
   * @param {ExecuteAsyncOperationPayload} payload Payload with data
   * @param {String} payload.operationSystemName System name of the async operation
   * @param {Object} payload.operationBody Data for operation. Will be passed to the backed API
   *
   * @example
   * MindboxSdk.executeAsyncOperation({
   *   operationSystemName: '--YOUR SYSTEM NAME HERE--',
   *   operationBody: { ... },
   * });
   */
  public executeAsyncOperation(payload: ExecuteAsyncOperationPayload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('payload is required!')
    }

    const { operationSystemName, operationBody } = payload

    if (!operationSystemName || typeof operationSystemName !== 'string') {
      throw new Error('operationSystemName is required and must be a string!')
    }

    if (!operationBody || typeof operationBody !== 'object') {
      throw new Error('operationBody is required!')
    }

    const jsonStringPayload = JSON.stringify(operationBody)

    MindboxSdkNative.executeAsyncOperation(operationSystemName, jsonStringPayload)
  }

  /**
   * @name executeSyncOperation
   * @description Makes request to backend API and waits response.
   * @param {ExecuteSyncOperationPayload} payload Payload with data
   * @param {String} payload.operationSystemName System name of the async operation
   * @param {Object} payload.operationBody Data for operation. Will be passed to the backed API
   * @param {function(data: ExecuteSyncOperationSuccess): void} payload.onSuccess Callback will return data in case of successfull request
   * @param {function(error: ExecuteSyncOperationError): void} payload.onError Callback will return error data in case of unsuccessfull request
   *
   * @example
   * MindboxSdk.executeSyncOperation({
   *   operationSystemName: '--YOUR SYSTEM NAME HERE--',
   *   operationBody: { ... },
   *   onSuccess: (data) => { ... },
   *   onError: (error) => { ... },
   * });
   */
  public executeSyncOperation(payload: ExecuteSyncOperationPayload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('payload is required!')
    }

    const { operationSystemName, operationBody, onSuccess, onError } = payload

    if (!operationSystemName || typeof operationSystemName !== 'string') {
      throw new Error('operationSystemName is required and must be a string!')
    }

    if (!operationBody || typeof operationBody !== 'object') {
      throw new Error('operationBody is required!')
    }

    if (!onSuccess || typeof onSuccess !== 'function') {
      throw new Error('onSuccess callback is required!')
    }

    if (onError && typeof onError !== 'function') {
      throw new Error('onError callback must be a function!')
    }

    const jsonStringPayload = JSON.stringify(operationBody)

    MindboxSdkNative.executeSyncOperation(operationSystemName, jsonStringPayload).then((data: string) => {
      const response = JSON.parse(data)

      if (response.type && ['MindboxError', 'NetworkError', 'InternalError'].includes(response.type)) {
        onError(response)
      } else {
        onSuccess(response)
      }
    })
  }

  /**
   * Method for managing sdk logging
   *
   * @param level - is used for showing Mindbox logs starts from [LogLevel]. Default
   * is [LogLevel.WARN]. [LogLevel.NONE] turns off all logs.
   */
  public setLogLevel(level: LogLevel) {
    MindboxSdkNative.setLogLevel(level)
  }

  /**
   * Returns SDK version
   */
  public getSdkVersion(callback: (sdkVersion: string) => void) {
    return MindboxSdkNative.getSdkVersion().then((version: string) => callback(version))
  }

  /**
   *
   * Creates and deliveries event of "Push delivered". Recommended call this method from
   * background thread.
   *
   * Use this method only if you have custom push handling you don't use [Mindbox.handleRemoteMessage].
   * You must not call it otherwise.
   *
   * @param uniqKey unique identifier of push notification
   * @deprecated since version 2.10.3. Use native methods
   */
  public pushDelivered(uniqKey: string) {
    this.writeNativeLog('Used deprecated method pushDelivered. Use native methods', LogLevel.WARN)
    return MindboxSdkNative.pushDelivered(uniqKey)
  }

  /**
   * Checks the current system authorization status for push notifications
   * and reports any changes to Mindbox.
   *
   * @example
   * MindboxSdk.refreshNotificationPermissionStatus()
   */
  public refreshNotificationPermissionStatus() {
    return MindboxSdkNative.refreshNotificationPermissionStatus()
  }

  /**
   * Writes a log message to the native Mindbox logging system.
   *
   * Usage example:
   *
   *  MindboxSdk..writeNativeLog(
   *     message: "This is a debug message",
   *     logLevel: LogLevel.DEBUG,
   *  );
   *
   * @param message: The message to be logged.
   * @param logLevel: The severity level of the log message [LogLevel].
   */
  public writeNativeLog(message: String, logLevel: LogLevel) {
    const prefixedMessage = `${this._prefix} ${message}`
    return MindboxSdkNative.writeNativeLog(prefixedMessage, logLevel)
  }
}

const MindboxSdk = new MindboxSdkClass()

export default MindboxSdk

export { LogLevel } from './LogLevel'

export { InAppCallback, CopyPayloadInAppCallback, EmptyInAppCallback, UrlInAppCallback } from './InAppCallback'
