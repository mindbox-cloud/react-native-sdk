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
    executeAsyncOperation: jest.fn(
      (operationSystemName: string, operationBodyString: string) =>
        new Promise((resolve, reject) => {
          if (
            operationSystemName &&
            typeof operationSystemName === 'string' &&
            operationSystemName.length > 0 &&
            operationBodyString &&
            typeof operationBodyString === 'string' &&
            operationBodyString.length > 0
          ) {
            resolve(true);
          } else {
            reject(new Error('Error'));
          }
        })
    ),
    executeSyncOperation: jest.fn(
      (operationSystemName: string, operationBodyString: string) =>
        new Promise((resolve, reject) => {
          if (
            operationSystemName &&
            typeof operationSystemName === 'string' &&
            operationBodyString &&
            typeof operationBodyString === 'string'
          ) {
            if (operationSystemName !== 'personalReco.sync') {
              resolve(
                JSON.stringify({
                  type: 'MindboxError',
                  data: {
                    status: 'ProtocolError',
                    errorMessage: 'Operation WrongOperationName.sync not found',
                    errorId: 'fb6f5556-7e88-415f-950f-5d483bc0f3d1',
                    httpStatusCode: 400,
                  },
                })
              );
            } else if (
              operationBodyString !==
              JSON.stringify({ recommendation: { limit: '10' } })
            ) {
              resolve(
                JSON.stringify({
                  type: 'MindboxError',
                  data: {
                    status: 'ProtocolError',
                    errorMessage:
                      '/recommendation/limit: "ururu" не является корректным целым числом. Поле должно содержать целое число не превышающее 2147483647.',
                    errorId: 'afa03759-52e8-43b7-83ad-ad7b48d559f3',
                    httpStatusCode: 400,
                  },
                })
              );
            } else {
              resolve(
                JSON.stringify({
                  status: 'Success',
                  recommendations: [
                    {
                      ids: {
                        mindboxId: 1528,
                        website: '4733',
                      },
                      productGroup: {
                        ids: {
                          website: '3063',
                        },
                      },
                      name: 'NikeCourt Advantage RF',
                      description:
                        "Made from sweat-wicking fabric, the NikeCourt Advantage RF Men's Tennis Polo helps keep you cool and dry when the match heats up.",
                      displayName: 'NikeCourt Advantage RF',
                      url: 'https://demoshop.mindbox.cloud/catalog/muzhchiny/futbolki/3063/?oid=4733&r1=yandext&r2=',
                      pictureUrl:
                        'https://demoshop.mindbox.cloud/upload/iblock/462/4622e4f88b4fe73063404f01aac9c4b0.jpg',
                      price: 1275.0,
                      oldPrice: 2550.0,
                      category: 'T-shirts',
                    },
                  ],
                })
              );
            }
          } else {
            reject(new Error('Error'));
          }
        })
    ),
    writeNativeLog: jest.fn(() =>
       new Promise((resolve) => {
           resolve(true);
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
  const asyncOperationSystemName = 'setProductList';
  const asyncOperationBody = {
    productList: [
      {
        count: 10,
        pricePerItem: 1,
        product: {
          ids: {
            website: 'test-1',
          },
        },
      },
      {
        count: 2,
        pricePerItem: 4,
        productGroup: {
          ids: {
            website: 'test-group-1',
          },
        },
      },
    ],
  };
  const asyncOperationBodyString = JSON.stringify(asyncOperationBody);
  const syncOperationSystemName = 'personalReco.sync';
  const syncOperationBody = {
    recommendation: {
      limit: '10',
    },
  };
  const syncOperationBodyString = JSON.stringify(syncOperationBody);

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

    describe('Testing executeAsyncOperation method', () => {
      it('throws error when no payload passed', async () => {
        expect.assertions(2);

        await expect(
          MindboxSdk.executeAsyncOperation('', asyncOperationBodyString)
        ).rejects.toThrow('Error');

        await expect(
          MindboxSdk.executeAsyncOperation(asyncOperationSystemName, '')
        ).rejects.toThrow('Error');
      });

      it('throws error when non string payload passed', async () => {
        expect.assertions(2);

        await expect(
          MindboxSdk.executeAsyncOperation(123, asyncOperationBodyString)
        ).rejects.toThrow('Error');

        await expect(
          MindboxSdk.executeAsyncOperation(asyncOperationSystemName, 123)
        ).rejects.toThrow('Error');
      });

      it('resolves successfully with string payload passed', async () => {
        expect.assertions(1);

        await expect(
          MindboxSdk.executeAsyncOperation(
            asyncOperationSystemName,
            asyncOperationBodyString
          )
        ).resolves.toBeTruthy();
      });
    });

    describe('Testing executeSyncOperation method', () => {
      it('throws error when no payload passed', async () => {
        expect.assertions(2);

        await expect(
          MindboxSdk.executeSyncOperation('', syncOperationBodyString)
        ).rejects.toThrow('Error');

        await expect(
          MindboxSdk.executeSyncOperation(syncOperationSystemName, '')
        ).rejects.toThrow('Error');
      });

      it('throws error when non string payload passed', async () => {
        expect.assertions(2);

        await expect(
          MindboxSdk.executeSyncOperation(123, syncOperationBodyString)
        ).rejects.toThrow('Error');

        await expect(
          MindboxSdk.executeSyncOperation(syncOperationSystemName, 123)
        ).rejects.toThrow('Error');
      });

      it('resolves with ProtocolError with wrong operation name', async () => {
        expect.assertions(1);

        await expect(
          MindboxSdk.executeSyncOperation(
            'WrongOperationName',
            syncOperationBodyString
          )
        ).resolves.toBe(
          JSON.stringify({
            type: 'MindboxError',
            data: {
              status: 'ProtocolError',
              errorMessage: 'Operation WrongOperationName.sync not found',
              errorId: 'fb6f5556-7e88-415f-950f-5d483bc0f3d1',
              httpStatusCode: 400,
            },
          })
        );
      });

      it('resolves with ProtocolError with wrong operation body parameter', async () => {
        expect.assertions(1);

        await expect(
          MindboxSdk.executeSyncOperation(
            syncOperationSystemName,
            JSON.stringify({
              ...syncOperationBody,
              recommendation: {
                limit: 'wrongValue',
              },
            })
          )
        ).resolves.toBe(
          JSON.stringify({
            type: 'MindboxError',
            data: {
              status: 'ProtocolError',
              errorMessage:
                '/recommendation/limit: "ururu" не является корректным целым числом. Поле должно содержать целое число не превышающее 2147483647.',
              errorId: 'afa03759-52e8-43b7-83ad-ad7b48d559f3',
              httpStatusCode: 400,
            },
          })
        );
      });

      it('resolves successfully with string payload passed', async () => {
        expect.assertions(1);

        await expect(
          MindboxSdk.executeSyncOperation(
            syncOperationSystemName,
            syncOperationBodyString
          )
        ).resolves.toBe(
          JSON.stringify({
            status: 'Success',
            recommendations: [
              {
                ids: {
                  mindboxId: 1528,
                  website: '4733',
                },
                productGroup: {
                  ids: {
                    website: '3063',
                  },
                },
                name: 'NikeCourt Advantage RF',
                description:
                  "Made from sweat-wicking fabric, the NikeCourt Advantage RF Men's Tennis Polo helps keep you cool and dry when the match heats up.",
                displayName: 'NikeCourt Advantage RF',
                url: 'https://demoshop.mindbox.cloud/catalog/muzhchiny/futbolki/3063/?oid=4733&r1=yandext&r2=',
                pictureUrl:
                  'https://demoshop.mindbox.cloud/upload/iblock/462/4622e4f88b4fe73063404f01aac9c4b0.jpg',
                price: 1275.0,
                oldPrice: 2550.0,
                category: 'T-shirts',
              },
            ],
          })
        );
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
      await MindboxSdk.initialize(initializationData);

      expect.assertions(2);

      MindboxSdk.getToken((token: string) => {
        expect(token).toEqual('APNS');
      });

      Platform.OS = 'android';

      MindboxSdk.getToken((token: string) => {
        expect(token).toEqual('FMS');
      });


    });

    it('updateToken method resolves successfully', async () => {
      const MindboxSdk = require('../index').default;

      expect.assertions(1);

      await expect(MindboxSdk.updateToken('newToken')).resolves.toBeUndefined();
    });

    it('onPushClickReceived method works correctly', () => {
      const MindboxSdk = require('../index').default;

      expect.assertions(2);

      expect(MindboxSdk.subscribedForPushClickedEvent).toBeFalsy();

      MindboxSdk.onPushClickReceived(() => {});

      expect(MindboxSdk.subscribedForPushClickedEvent).toBeTruthy();
    });

    it('executeAsyncOperation method works correctly', () => {
      const MindboxSdk = require('../index').default;

      expect.assertions(1);

      expect(
        MindboxSdk.executeAsyncOperation({
          operationSystemName: asyncOperationSystemName,
          operationBody: asyncOperationBody,
        })
      ).toBeUndefined();
    });

    it('executeSyncOperation method works correctly', async () => {
      const MindboxSdk = require('../index').default;

      expect.assertions(3);

      let successResponse = null;
      let errorResponse = null;

      expect(
        MindboxSdk.executeSyncOperation({
          operationSystemName: syncOperationSystemName,
          operationBody: syncOperationBody,
          onSuccess: (data: any) => {
            successResponse = data;
          },
          onError: (error: any) => {
            errorResponse = error;
          },
        })
      ).toBeUndefined();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(successResponse).toStrictEqual({
        status: 'Success',
        recommendations: [
          {
            ids: {
              mindboxId: 1528,
              website: '4733',
            },
            productGroup: {
              ids: {
                website: '3063',
              },
            },
            name: 'NikeCourt Advantage RF',
            description:
              "Made from sweat-wicking fabric, the NikeCourt Advantage RF Men's Tennis Polo helps keep you cool and dry when the match heats up.",
            displayName: 'NikeCourt Advantage RF',
            url: 'https://demoshop.mindbox.cloud/catalog/muzhchiny/futbolki/3063/?oid=4733&r1=yandext&r2=',
            pictureUrl:
              'https://demoshop.mindbox.cloud/upload/iblock/462/4622e4f88b4fe73063404f01aac9c4b0.jpg',
            price: 1275.0,
            oldPrice: 2550.0,
            category: 'T-shirts',
          },
        ],
      });

      expect(errorResponse).toBeNull();
    });
  });
});
