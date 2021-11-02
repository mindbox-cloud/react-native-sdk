import {
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';

const { MindboxSdk: MindboxSdkNative, MindboxJsDelivery } = NativeModules;

type InitializationData = {
  domain: string;
  endpointId: string;
  subscribeCustomerIfCreated: boolean;
  shouldCreateCustomer?: boolean;
  previousInstallId?: string;
  previousUuid?: string;
};

type GetDeviceUUIDCallback = (deviceUUID: string) => any;

type GetTokenCallback = (token: string) => any;

type OnPushClickReceivedCallback = (payload: string) => any;

type ExecuteAsyncOperationPayload = {
  operationSystemName: string;
  operationBody: { [key: string]: any };
};

type ExecuteSyncOperationPayload = {
  operationSystemName: string;
  operationBody: { [key: string]: any };
  onResponse: (
    response: { [key: string]: any } | null,
    error: { [key: string]: any } | null
  ) => any;
  onError?: (error: Error) => any;
};

class MindboxSdkClass {
  private _initialized: boolean;
  private _initializing: boolean;
  private _callbacks: Array<() => void>;
  private _mindboxJsDeliveryEvents: NativeEventEmitter;
  private _emitterSubscribtion?: EmitterSubscription;

  constructor() {
    this._initialized = false;
    this._initializing = false;
    this._callbacks = [];
    this._mindboxJsDeliveryEvents = new NativeEventEmitter(MindboxJsDelivery);
  }

  get initialized() {
    return this._initialized;
  }

  get subscribedForPushClickedEvent() {
    return !!this._emitterSubscribtion;
  }

  public async initialize(initializationData: InitializationData) {
    if (this._initializing) {
      console.warn('MindboxSdk is already initializing');
      return;
    }

    this._initializing = true;

    if (this._initialized) {
      console.warn('MindboxSdk is already initialized');
      this._initializing = false;
      return;
    }

    if (!initializationData || typeof initializationData !== 'object') {
      throw new Error('Wrong initialization data!');
    }

    const {
      domain,
      endpointId,
      subscribeCustomerIfCreated,
      shouldCreateCustomer,
      previousInstallId,
      previousUuid,
    } = initializationData;

    if (!domain || !endpointId) {
      throw new Error('Wrong initialization data!');
    }

    const payload: InitializationData = {
      domain,
      endpointId,
      subscribeCustomerIfCreated,
    };

    if (typeof shouldCreateCustomer !== 'undefined') {
      payload.shouldCreateCustomer = shouldCreateCustomer;
    }

    if (
      typeof previousInstallId !== 'undefined' &&
      previousInstallId.length > 0
    ) {
      payload.previousInstallId = previousInstallId;
    }

    if (typeof previousUuid !== 'undefined' && previousUuid.length > 0) {
      payload.previousUuid = previousUuid;
    }

    try {
      const payloadString = JSON.stringify(payload);
      this._initialized = await MindboxSdkNative.initialize(payloadString);
      this._initializing = false;

      for (let i = 0; i < this._callbacks.length; i++) {
        this._callbacks[i]();
      }

      this._callbacks = [];
    } catch (error) {
      this._initializing = false;
      throw error;
    }
  }

  public getDeviceUUID(callback: GetDeviceUUIDCallback) {
    if (!callback || typeof callback !== 'function') {
      throw new Error('Callback is required!');
    }

    const callbackHandler = () => {
      MindboxSdkNative.getDeviceUUID().then((deviceUUID: string) =>
        callback(deviceUUID)
      );
    };

    if (this._initialized) {
      callbackHandler();
    } else {
      this._callbacks.push(callbackHandler);
    }
  }

  public getToken(callback: GetTokenCallback) {
    if (!callback || typeof callback !== 'function') {
      throw new Error('Callback is required!');
    }

    const callbackHandler = () => {
      let promise = null;

      switch (Platform.OS) {
        case 'ios':
          promise = MindboxSdkNative.getAPNSToken();
          break;

        case 'android':
          promise = MindboxSdkNative.getFMSToken();
          break;

        default:
          promise = MindboxSdkNative.getAPNSToken();
          break;
      }

      promise.then((token: string) => callback(token));
    };

    if (this._initialized) {
      callbackHandler();
    } else {
      this._callbacks.push(callbackHandler);
    }
  }

  public async updateToken(token: string) {
    if (!token || typeof token !== 'string') {
      throw new Error('Token is required!');
    }

    switch (Platform.OS) {
      case 'ios':
        try {
          await MindboxSdkNative.updateAPNSToken(token);
        } catch (error) {
          throw error;
        }
        break;

      case 'android':
        try {
          await MindboxSdkNative.updateFMSToken(token);
        } catch (error) {
          throw error;
        }
        break;

      default:
        try {
          await MindboxSdkNative.updateAPNSToken(token);
        } catch (error) {
          throw error;
        }
        break;
    }
  }

  public onPushClickReceived(callback: OnPushClickReceivedCallback) {
    if (!callback || typeof callback !== 'function') {
      throw new Error('Callback is required!');
    }

    if (this._emitterSubscribtion) {
      this._emitterSubscribtion.remove();
    }

    this._emitterSubscribtion = this._mindboxJsDeliveryEvents.addListener(
      'pushNotificationClicked',
      callback
    );
  }

  public executeAsyncOperation(payload: ExecuteAsyncOperationPayload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload is required!');
    }

    const { operationSystemName, operationBody } = payload;

    if (!operationSystemName || typeof operationSystemName !== 'string') {
      throw new Error('operationSystemName is required and must be a string!');
    }

    if (!operationBody || typeof operationBody !== 'object') {
      throw new Error('operationBody is required!');
    }

    const jsonStringPayload = JSON.stringify(operationBody);

    MindboxSdkNative.executeAsyncOperation(
      operationSystemName,
      jsonStringPayload
    );
  }

  public executeSyncOperation(payload: ExecuteSyncOperationPayload) {
    if (!payload || typeof payload !== 'object') {
      return;
    }

    const { operationSystemName, operationBody, onResponse, onError } = payload;

    if (!operationSystemName || typeof operationSystemName !== 'string') {
      return;
    }

    if (!operationBody || typeof operationBody !== 'object') {
      return;
    }

    if (!onResponse || typeof onResponse !== 'function') {
      return;
    }

    if (onError && typeof onError !== 'function') {
      return;
    }

    const jsonStringPayload = JSON.stringify(operationBody);

    MindboxSdkNative.executeSyncOperation(
      operationSystemName,
      jsonStringPayload
    )
      .then((response: string) => {
        const data: { [key: string]: any } = JSON.parse(response);

        if (data.status) {
          onResponse(data, null);
        } else {
          onResponse(null, data);
        }
      })
      .catch((error: Error) => {
        if (onError) {
          onError(error);
        }
      });
  }
}

const MindboxSdk = new MindboxSdkClass();

export default MindboxSdk;
