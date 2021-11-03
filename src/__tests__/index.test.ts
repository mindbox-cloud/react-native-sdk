import { Platform } from 'react-native';

jest.mock('react-native', () => {
  const actualReactNative = jest.requireActual('react-native');

  actualReactNative.NativeModules.MindboxSdk = {
    initialize: jest.fn(
      (payloadString: string) =>
        new Promise(async (resolve, reject) => {
          if (payloadString && typeof payloadString === 'string') {
            try {
              const paylaod = JSON.parse(payloadString);

              if (!paylaod.domain || !paylaod.endpointId) {
                reject(new Error('Error'));
              } else {
                resolve(true);
              }
            } catch (error) {
              reject(error);
            }
            resolve(true);
          } else {
            reject(new Error('Error'));
          }
        })
    ),
    getDeviceUUID: jest.fn(
      () =>
        new Promise((resolve) => {
          resolve('UUID');
        })
    ),
    getAPNSToken: jest.fn(
      () =>
        new Promise((resolve) => {
          resolve('APNS');
        })
    ),
    getFMSToken: jest.fn(
      () =>
        new Promise((resolve) => {
          resolve('FMS');
        })
    ),
    updateAPNSToken: jest.fn(
      (payloadString: string) =>
        new Promise((resolve, reject) => {
          if (payloadString && typeof payloadString === 'string') {
            resolve(true);
          } else {
            reject(new Error('Error'));
          }
        })
    ),
    updateFMSToken: jest.fn(
      (payloadString: string) =>
        new Promise((resolve, reject) => {
          if (payloadString && typeof payloadString === 'string') {
            resolve(true);
          } else {
            reject(new Error('Error'));
          }
        })
    ),
  };

  actualReactNative.NativeModules.MindboxJsDelivery = {
    addListener: jest.fn(),
    supportedEvents: jest.fn(() => ['pushNotificationClicked']),
    startObserving: jest.fn(),
    stopObserving: jest.fn(),
  };

  return actualReactNative;
});

describe('Testing Mindbox RN SDK', () => {
  const initializationData = {
    domain: 'api.mindbox.ru',
    endpointId:
      Platform.OS === 'ios'
        ? 'pushok-rn-ios-sandbox'
        : 'pushok-rn-android-sandbox',
    subscribeCustomerIfCreated: true,
    shouldCreateCustomer: true,
    previousInstallId: '',
    previousUuid: '',
  };

  describe('Testing Mindbox RN SDK native methods', () => {
    const {
      NativeModules: { MindboxSdk },
    } = require('react-native');

    describe('Testing initialize method', () => {
      it('throws errors when no paylaod passed or payload is not a JSON string', async () => {
        expect.assertions(3);

        await expect(MindboxSdk.initialize()).rejects.toThrow('Error');
        await expect(MindboxSdk.initialize(123)).rejects.toThrow('Error');
        await expect(MindboxSdk.initialize('notJSONString')).rejects.toThrow(
          'Unexpected token'
        );
      });

      it('throws error when no valid payload data was passed', async () => {
        expect.assertions(1);

        const notValidInitializationData = {
          ...initializationData,
          domain: '',
        };

        await expect(
          MindboxSdk.initialize(notValidInitializationData)
        ).rejects.toThrow('Error');
      });

      it('resolves successfully with string payload passed', async () => {
        expect.assertions(1);

        const payloadString = JSON.stringify(initializationData);

        await expect(
          MindboxSdk.initialize(payloadString)
        ).resolves.toBeTruthy();
      });
    });

    describe('Testing getDeviceUUID method', () => {
      it('resolves successfully with string payload', async () => {
        expect.assertions(1);

        await expect(MindboxSdk.getDeviceUUID()).resolves.toEqual('UUID');
      });
    });

    describe('Testing getAPNSToken method', () => {
      it('resolves successfully with string payload', async () => {
        expect.assertions(1);

        await expect(MindboxSdk.getAPNSToken()).resolves.toEqual('APNS');
      });
    });

    describe('Testing getFMSToken method', () => {
      it('resolves successfully with string payload', async () => {
        expect.assertions(1);

        await expect(MindboxSdk.getFMSToken()).resolves.toEqual('FMS');
      });
    });

    describe('Testing updateAPNSToken method', () => {
      it('throws error when no paylaod passed', async () => {
        expect.assertions(1);

        await expect(MindboxSdk.updateAPNSToken()).rejects.toThrow('Error');
      });

      it('throws error when non string payload passed', async () => {
        expect.assertions(1);

        const wrongPaylaod = {
          one: 'one',
          two: 'two',
        };

        await expect(MindboxSdk.updateAPNSToken(wrongPaylaod)).rejects.toThrow(
          'Error'
        );
      });

      it('resolves successfully with string payload passed', async () => {
        expect.assertions(1);

        const payloadString = 'NewFMSToken';

        await expect(
          MindboxSdk.updateAPNSToken(payloadString)
        ).resolves.toBeTruthy();
      });
    });

    describe('Testing updateFMSToken method', () => {
      it('throws error when no paylaod passed', async () => {
        expect.assertions(1);

        await expect(MindboxSdk.updateFMSToken()).rejects.toThrow('Error');
      });

      it('throws error when non string payload passed', async () => {
        expect.assertions(1);

        const wrongPaylaod = {
          one: 'one',
          two: 'two',
        };

        await expect(MindboxSdk.updateFMSToken(wrongPaylaod)).rejects.toThrow(
          'Error'
        );
      });

      it('resolves successfully with string payload passed', async () => {
        expect.assertions(1);

        const payloadString = 'NewFMSToken';

        await expect(
          MindboxSdk.updateFMSToken(payloadString)
        ).resolves.toBeTruthy();
      });
    });
  });

  describe('Testing Mindbox RN SDK public interface', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('initialized param returns actual state', async () => {
      const MindboxSdk = require('../index').default;

      expect.assertions(2);

      expect(MindboxSdk.initialized).toBeFalsy();

      await MindboxSdk.initialize(initializationData);

      expect(MindboxSdk.initialized).toBeTruthy();
    });

    it('subscribedForPushClickedEvent param returns actual state', () => {
      const MindboxSdk = require('../index').default;

      expect(MindboxSdk.subscribedForPushClickedEvent).toBeFalsy();

      MindboxSdk.onPushClickReceived(() => {});

      expect(MindboxSdk.subscribedForPushClickedEvent).toBeTruthy();
    });

    it('initialize method resolves successfully', async () => {
      const MindboxSdk = require('../index').default;

      expect.assertions(3);

      expect(MindboxSdk.initialized).toBeFalsy();

      await expect(
        MindboxSdk.initialize(initializationData)
      ).resolves.toBeUndefined();

      expect(MindboxSdk.initialized).toBeTruthy();
    });

    it('getDeviceUUID method works correctly', async () => {
      const MindboxSdk = require('../index').default;

      expect.assertions(1);

      MindboxSdk.getDeviceUUID((uuid: string) => {
        expect(uuid).toEqual('UUID');
      });

      await MindboxSdk.initialize(initializationData);
    });

    it('getToken method works correctly', async () => {
      const MindboxSdk = require('../index').default;

      expect.assertions(2);

      MindboxSdk.getToken((token: string) => {
        expect(token).toEqual('APNS');
      });

      Platform.OS = 'android';

      MindboxSdk.getToken((token: string) => {
        expect(token).toEqual('FMS');
      });

      await MindboxSdk.initialize(initializationData);
    });

    it('updateToken method resolves successfully', async () => {
      const MindboxSdk = require('../index').default;

      expect.assertions(1);

      await expect(MindboxSdk.updateToken('newToken')).resolves.toBeUndefined();
    });

    it('onPushClickReceived method works correctly', () => {
      const MindboxSdk = require('../index').default;

      expect(MindboxSdk.subscribedForPushClickedEvent).toBeFalsy();

      MindboxSdk.onPushClickReceived(() => {});

      expect(MindboxSdk.subscribedForPushClickedEvent).toBeTruthy();
    });
  });
});
