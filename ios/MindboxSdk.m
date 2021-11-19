#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(MindboxSdk, NSObject)

RCT_EXTERN_METHOD(initialize:(NSString)payloadString resolve:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getDeviceUUID:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getAPNSToken:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateAPNSToken:(NSString)token resolve:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(executeAsyncOperation:(NSString)operationSystemName operationBody:(NSString)operationBody resolve:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(executeSyncOperation:(NSString)operationSystemName operationBody:(NSString)operationBody resolve:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
@end
