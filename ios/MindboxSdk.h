#import <Foundation/Foundation.h>

#if __has_include(<MindboxSdkSpec/MindboxSdkSpec.h>)
#import <MindboxSdkSpec/MindboxSdkSpec.h>
#elif __has_include("MindboxSdkSpec.h")
#import "MindboxSdkSpec.h"
#endif

NS_ASSUME_NONNULL_BEGIN

@interface MindboxSdk : NativeMindboxSdkSpecBase <NativeMindboxSdkSpec>

@end

NS_ASSUME_NONNULL_END
