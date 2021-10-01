import { NativeModules, Platform } from 'react-native';

const { MindboxSdk: MindboxSdkNative } = NativeModules;

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

class MindboxSdkClass {
  private _initialized: boolean;
  private _initializing: boolean;
  private _callbacks: Array<() => void>;

  constructor() {
    this._initialized = false;
    this._initializing = false;
    this._callbacks = [];
  }

  get initialized() {
    return this._initialized;
  }

  public async initialize(initializationData: InitializationData) {
    if (this._initializing) {
      return;
    }

    this._initializing = true;

    if (this._initialized) {
      this._initializing = false;
      return;
    }

    const {
      domain,
      endpointId,
      subscribeCustomerIfCreated,
      shouldCreateCustomer,
      previousInstallId,
      previousUuid,
    } = initializationData;

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
    if (typeof callback !== 'function') {
      return;
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
    if (typeof callback !== 'function') {
      return;
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
}

const MindboxSdk = new MindboxSdkClass();

export default MindboxSdk;
