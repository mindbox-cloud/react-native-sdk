#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(MindboxSdk, NSObject)

RCT_EXTERN_METHOD(initialize:(NSString)domain endpoint:(NSString)endpoint)

@end
