#import "MindboxSdk.h"
#import "MindboxSdk-Swift.h"
#import <React/RCTBridgeModule.h>

@implementation MindboxSdk {
    MindboxSdkImpl *_impl;
}

RCT_EXPORT_MODULE(MindboxSdk)

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        _impl = [MindboxSdkImpl new];
        __weak MindboxSdk *weakSelf = self;
        _impl.eventEmitHandler = ^(NSString *eventName, NSDictionary<NSString *, NSString *> *body) {
            MindboxSdk *strongSelf = weakSelf;
            if (!strongSelf) return;
            if ([eventName isEqualToString:@"onPushNotificationClicked"]) {
                [strongSelf emitOnPushNotificationClicked:body];
            } else if ([eventName isEqualToString:@"onInAppClick"]) {
                [strongSelf emitOnInAppClick:body];
            } else if ([eventName isEqualToString:@"onInAppDismiss"]) {
                [strongSelf emitOnInAppDismiss:body];
            }
        };
    }
    return self;
}

- (void)initialize:(NSString *)payloadString
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
    [_impl initialize:payloadString resolve:resolve reject:reject];
}

- (void)registerCallbacks:(NSArray *)callbacks {
    [_impl registerCallbacks:callbacks];
}

- (void)getDeviceUUID:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject {
    [_impl getDeviceUUID:resolve reject:reject];
}

- (void)getTokens:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject {
    [_impl getTokens:resolve reject:reject];
}

- (void)executeAsyncOperation:(NSString *)operationSystemName
                operationBody:(NSString *)operationBody
                      resolve:(RCTPromiseResolveBlock)resolve
                       reject:(RCTPromiseRejectBlock)reject {
    [_impl executeAsyncOperation:operationSystemName operationBody:operationBody resolve:resolve reject:reject];
}

- (void)executeSyncOperation:(NSString *)operationSystemName
               operationBody:(NSString *)operationBody
                     resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject {
    [_impl executeSyncOperation:operationSystemName operationBody:operationBody resolve:resolve reject:reject];
}

- (void)onPushClickedIsRegistered:(BOOL)isRegistered {
    [_impl onPushClickedIsRegistered:isRegistered];
}

- (void)setLogLevel:(double)level {
    [_impl setLogLevel:level];
}

- (void)getSdkVersion:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject {
    [_impl getSdkVersion:resolve reject:reject];
}

- (void)pushDelivered:(NSString *)uniqKey {
    [_impl pushDelivered:uniqKey];
}

- (void)refreshNotificationPermissionStatus {
    [_impl refreshNotificationPermissionStatus];
}

- (void)writeNativeLog:(NSString *)message
              logLevel:(double)logLevel {
    [_impl writeNativeLog:message logLevel:logLevel];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeMindboxSdkSpecJSI>(params);
}

@end
