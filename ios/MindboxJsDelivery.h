//
//  MindboxJsDelivery.h
//  MindboxSdk
//
//  Created by Nikolay Seleznev on 15.10.2021.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface MindboxJsDelivery : RCTEventEmitter <RCTBridgeModule>

+ (void)emitEvent:(UNNotificationResponse *)response;

+ (void)sendInappEvent:(NSString *)eventName eventId:(NSString *)eventId url:(NSString *)clickUrl payload:(NSString *)payload;
@end
