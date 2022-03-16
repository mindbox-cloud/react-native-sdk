//
//  MindboxJsDelivery.m
//  MindboxSdk
//
//  Created by Nikolay Seleznev on 15.10.2021.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import "MindboxJsDelivery.h"

#import <UserNotifications/UserNotifications.h>

@implementation MindboxJsDelivery

RCT_EXPORT_MODULE();

bool hasListeners = NO;
NSDictionary *storedEventDetails;

- (NSArray<NSString *> *)supportedEvents {
  return @[@"pushNotificationClicked"];
}

- (void)startObserving {
  hasListeners = YES;
  
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(emitEventInternal:) name:@"event-emitted" object:nil];
  
  if (storedEventDetails != NULL) {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"event-emitted" object:self userInfo:storedEventDetails];
  }
}

- (void)stopObserving {
  hasListeners = NO;
  
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  
  if (storedEventDetails != NULL) {
    storedEventDetails = NULL;
  }
}

- (void)emitEventInternal:(NSNotification *)notification {
  NSArray *eventDetails = [notification.userInfo valueForKey:@"detail"];
  NSString *eventName = [eventDetails objectAtIndex:0];
  NSString *actionIdentifier = [eventDetails objectAtIndex:1];
  NSDictionary *userInfo = [eventDetails objectAtIndex:2];
  NSString *clickUrl = @"";
  
  if ([actionIdentifier isEqual:UNNotificationDefaultActionIdentifier]) {
    clickUrl = [userInfo objectForKey:@"clickUrl"];
      
    if ([clickUrl length] == 0) {
      NSDictionary *aps = [userInfo objectForKey:@"aps"];
      clickUrl = [aps objectForKey:@"clickUrl"];
    }
  } else {
    NSPredicate *predicate = [NSPredicate predicateWithFormat:@"uniqueKey == %@", actionIdentifier];
    NSArray *filteredArray = [[userInfo objectForKey:@"buttons"] filteredArrayUsingPredicate:predicate];
    
    if (filteredArray.count > 0) {
      clickUrl = [filteredArray.firstObject objectForKey:@"url"];
    }
  }

  [self sendEventWithName:eventName body:clickUrl];
  
  
  if (storedEventDetails != NULL) {
    storedEventDetails = NULL;
  }
}

+ (void)emitEvent:(UNNotificationResponse *)response {
  NSDictionary *userInfo = response.notification.request.content.userInfo;
  NSString *name = @"pushNotificationClicked";
  NSString *actionIdentifier = response.actionIdentifier;
  NSDictionary *eventDetails = @{@"detail":@[name,actionIdentifier,userInfo]};
  if (hasListeners) {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"event-emitted" object:self userInfo:eventDetails];
  } else {
    storedEventDetails = eventDetails;
  }
}

@end
