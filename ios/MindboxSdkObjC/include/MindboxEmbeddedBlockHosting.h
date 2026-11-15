#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol MindboxEmbeddedBlockHosting <NSObject>

@property (nonatomic, readonly) UIView *view;

- (void)setHostVisible:(BOOL)isHostVisible;
- (void)setStandInsWithHasPlaceholder:(BOOL)hasPlaceholder
                         hasErrorView:(BOOL)hasErrorView NS_SWIFT_NAME(setStandIns(hasPlaceholder:hasErrorView:));
- (void)tearDown;

@end

@protocol MindboxEmbeddedBlockHostMaking <NSObject>

+ (id<MindboxEmbeddedBlockHosting>)makeHostWithPlaceSystemName:(NSString *)placeSystemName
                                                         height:(CGFloat)height
                                                      timeoutMs:(double)timeoutMs
                                                loadingStrategy:(NSString *)loadingStrategy
                                                 animatesReveal:(BOOL)animatesReveal
                                                   onAppearance:(void (^)(NSString *appearance, BOOL animated, NSInteger revealDurationMs))onAppearance
                                                      onOutcome:(void (^)(NSString *outcome, NSString *_Nullable reason))onOutcome;

@end

NS_ASSUME_NONNULL_END
