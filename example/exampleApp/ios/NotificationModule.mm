#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

#if __has_include(<ExampleAppSpec/ExampleAppSpec.h>)
#import <ExampleAppSpec/ExampleAppSpec.h>
#elif __has_include("ExampleAppSpec.h")
#import "ExampleAppSpec.h"
#else
#error "ExampleAppSpec.h not found. Ensure React Native codegen is enabled for exampleApp."
#endif

@interface NotificationCenterStorage : NSObject
+ (NSString *)getNotificationCenterUpdatedName;
+ (NSString *)getNotificationsJson;
+ (void)clearNotifications;
@end

@interface NotificationModule : NativeNotificationModuleSpecBase <NativeNotificationModuleSpec>
@end

@implementation NotificationModule

RCT_EXPORT_MODULE(NotificationModule)

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        NSString *eventName = [NotificationCenterStorage getNotificationCenterUpdatedName];
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(handleNotificationCenterUpdated:) name:eventName object:nil];
    }
    return self;
}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)getNotifications:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject {
    resolve([NotificationCenterStorage getNotificationsJson]);
}

- (void)clearNotifications:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject {
    [NotificationCenterStorage clearNotifications];
    resolve(nil);
}

- (void)handleNotificationCenterUpdated:(NSNotification *)notification {
    if (!_eventEmitterCallback) {
        return;
    }
    [self emitOnNotificationCenterUpdated:@{}];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeNotificationModuleSpecJSI>(params);
}

@end
