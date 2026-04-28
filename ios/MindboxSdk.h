#import <Foundation/Foundation.h>

#if __has_include(<MindboxSdkSpec/MindboxSdkSpec.h>)
#import <MindboxSdkSpec/MindboxSdkSpec.h>
#elif __has_include("MindboxSdkSpec.h")
#import "MindboxSdkSpec.h"
#else
#error "MindboxSdkSpec.h not found. Ensure the React Native codegen spec has been generated and the New Architecture/codegen integration is enabled"
#endif

NS_ASSUME_NONNULL_BEGIN

@interface MindboxSdk : NativeMindboxSdkSpecBase <NativeMindboxSdkSpec>

@end

NS_ASSUME_NONNULL_END
