#if __has_include("MindboxSdk-Swift.h")
#import "MindboxSdk-Swift.h"
#elif __has_include(<MindboxSdk/MindboxSdk-Swift.h>)
#import <MindboxSdk/MindboxSdk-Swift.h>
#else
#error "MindboxSdk-Swift.h not found. Ensure Swift sources are included in the MindboxSdk pod target."
#endif

#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTViewComponentView.h>

#import <react/renderer/components/MindboxSdkSpec/ComponentDescriptors.h>
#import <react/renderer/components/MindboxSdkSpec/EventEmitters.h>
#import <react/renderer/components/MindboxSdkSpec/Props.h>
#import <react/renderer/components/MindboxSdkSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

@interface MindboxEmbeddedBlockViewComponentView : RCTViewComponentView <RCTMindboxEmbeddedBlockViewViewProtocol>
@end

@implementation MindboxEmbeddedBlockViewComponentView {
    MindboxEmbeddedBlockHost *_host;

    std::string _placeSystemName;
    CGFloat _blockHeight;
    double _timeoutMs;
    std::string _loadingStrategy;
    BOOL _animatesReveal;
    BOOL _hasPlaceholder;
    BOOL _hasErrorView;
    BOOL _isHostVisible;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<MindboxEmbeddedBlockViewComponentDescriptor>();
}

+ (BOOL)shouldBeRecycled
{
    return NO;
}

- (instancetype)initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame]) {
        static const auto defaultProps = std::make_shared<const MindboxEmbeddedBlockViewProps>();
        _props = defaultProps;
        _isHostVisible = YES;
        _animatesReveal = YES;
    }

    return self;
}

- (void)dealloc
{
    [_host tearDown];
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
    const auto &next = *std::static_pointer_cast<const MindboxEmbeddedBlockViewProps>(props);

    if (next.placeSystemName != _placeSystemName) {
        _placeSystemName = next.placeSystemName;
        [self dropHost];
    }

    _blockHeight = next.blockHeight;
    _timeoutMs = next.timeoutMs;
    _loadingStrategy = next.loadingStrategy;
    _animatesReveal = next.animatesReveal;
    _hasPlaceholder = next.hasPlaceholder;
    _hasErrorView = next.hasErrorView;
    _isHostVisible = next.hostVisible;

    if (_host != nil) {
        [_host setStandInsWithHasPlaceholder:_hasPlaceholder hasErrorView:_hasErrorView];
        [_host setHostVisible:_isHostVisible];
    }

    [super updateProps:props oldProps:oldProps];
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask
{
    [super finalizeUpdates:updateMask];

    if (_host != nil || CGRectIsEmpty(self.bounds)) {
        return;
    }

    // Fabric sets the event emitter before finalizeUpdates:, so the host's first report reaches JS.
    __weak MindboxEmbeddedBlockViewComponentView *weakSelf = self;
    _host = [[MindboxEmbeddedBlockHost alloc]
        initWithPlaceSystemName:@(_placeSystemName.c_str())
                         height:_blockHeight
                      timeoutMs:_timeoutMs
                loadingStrategy:@(_loadingStrategy.c_str())
                 animatesReveal:_animatesReveal
                   onAppearance:^(NSString *appearance, BOOL animated, NSInteger revealDurationMs) {
                       [weakSelf emitAppearance:appearance animated:animated revealDurationMs:revealDurationMs];
                   }
                      onOutcome:^(NSString *outcome, NSString *_Nullable reason) {
                          [weakSelf emitOutcome:outcome reason:reason];
                      }];
    [_host setStandInsWithHasPlaceholder:_hasPlaceholder hasErrorView:_hasErrorView];
    [_host setHostVisible:_isHostVisible];

    self.contentView = _host.view;
}

- (void)invalidate
{
    [self dropHost];
    _placeSystemName = "";
}

- (void)emitAppearance:(NSString *)appearance animated:(BOOL)animated revealDurationMs:(NSInteger)revealDurationMs
{
    if (!_eventEmitter) {
        return;
    }

    std::static_pointer_cast<const MindboxEmbeddedBlockViewEventEmitter>(_eventEmitter)
        ->onAppearanceChange({.appearance = std::string([appearance UTF8String]),
                              .animated = static_cast<bool>(animated),
                              .revealDurationMs = static_cast<int>(animated ? revealDurationMs : 0)});
}

- (void)emitOutcome:(NSString *)outcome reason:(NSString *_Nullable)reason
{
    if (!_eventEmitter) {
        return;
    }

    std::static_pointer_cast<const MindboxEmbeddedBlockViewEventEmitter>(_eventEmitter)
        ->onBlockOutcome({.outcome = std::string([outcome UTF8String]),
                          .reason = std::string([(reason ?: @"") UTF8String])});
}

- (void)dropHost
{
    if (_host == nil) {
        return;
    }

    [_host tearDown];
    self.contentView = nil;
    _host = nil;
}

@end

Class<RCTComponentViewProtocol> MindboxEmbeddedBlockViewCls(void)
{
    return MindboxEmbeddedBlockViewComponentView.class;
}

#else // RCT_NEW_ARCH_ENABLED

#import <React/RCTView.h>
#import <React/RCTViewManager.h>

// An RCTView: RCTViewManager writes the standard view props to it.
@interface MindboxEmbeddedBlockPaperView : RCTView

@property (nonatomic, copy) NSString *placeSystemName;
@property (nonatomic, assign) CGFloat blockHeight;
@property (nonatomic, assign) double timeoutMs;
@property (nonatomic, copy) NSString *loadingStrategy;
@property (nonatomic, assign) BOOL animatesReveal;
@property (nonatomic, assign) BOOL hasPlaceholder;
@property (nonatomic, assign) BOOL hasErrorView;
@property (nonatomic, assign) BOOL hostVisible;

@property (nonatomic, copy) RCTDirectEventBlock onAppearanceChange;
@property (nonatomic, copy) RCTDirectEventBlock onBlockOutcome;

@end

@implementation MindboxEmbeddedBlockPaperView {
    MindboxEmbeddedBlockHost *_host;
    NSString *_builtPlaceSystemName;
    double _builtTimeoutMs;
}

- (instancetype)initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame]) {
        _hostVisible = YES;
        _animatesReveal = YES;
    }

    return self;
}

- (void)dealloc
{
    [_host tearDown];
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
    [super didSetProps:changedProps];

    if (_host != nil && ![_builtPlaceSystemName isEqualToString:(_placeSystemName ?: @"")]) {
        [self dropHost];
    }

    if (_host != nil) {
        [_host setStandInsWithHasPlaceholder:_hasPlaceholder hasErrorView:_hasErrorView];
        [_host setHostVisible:_hostVisible];
        return;
    }

    [self buildHostIfPossible];
}

- (void)layoutSubviews
{
    [super layoutSubviews];

    [self buildHostIfPossible];
    _host.view.frame = self.bounds;
}

- (void)buildHostIfPossible
{
    if (_host != nil || CGRectIsEmpty(self.bounds)) {
        return;
    }

    _builtPlaceSystemName = _placeSystemName ?: @"";
    _builtTimeoutMs = _timeoutMs;

    // The event blocks are props, set before didSetProps: and any layout pass, so the host's first report reaches JS.
    __weak MindboxEmbeddedBlockPaperView *weakSelf = self;
    _host = [[MindboxEmbeddedBlockHost alloc]
        initWithPlaceSystemName:_builtPlaceSystemName
                         height:_blockHeight
                      timeoutMs:_builtTimeoutMs
                loadingStrategy:_loadingStrategy ?: @""
                 animatesReveal:_animatesReveal
                   onAppearance:^(NSString *appearance, BOOL animated, NSInteger revealDurationMs) {
                       MindboxEmbeddedBlockPaperView *strongSelf = weakSelf;
                       if (strongSelf.onAppearanceChange != nil) {
                           strongSelf.onAppearanceChange(@{
                               @"appearance" : appearance,
                               @"animated" : @(animated),
                               @"revealDurationMs" : @(animated ? revealDurationMs : 0),
                           });
                       }
                   }
                      onOutcome:^(NSString *outcome, NSString *_Nullable reason) {
                          MindboxEmbeddedBlockPaperView *strongSelf = weakSelf;
                          if (strongSelf.onBlockOutcome != nil) {
                              strongSelf.onBlockOutcome(@{@"outcome" : outcome, @"reason" : reason ?: @""});
                          }
                      }];
    [_host setStandInsWithHasPlaceholder:_hasPlaceholder hasErrorView:_hasErrorView];
    [_host setHostVisible:_hostVisible];

    UIView *blockView = _host.view;
    blockView.frame = self.bounds;
    blockView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [self addSubview:blockView];
}

- (void)dropHost
{
    if (_host == nil) {
        return;
    }

    [_host.view removeFromSuperview];
    [_host tearDown];
    _host = nil;
    _builtPlaceSystemName = nil;
}

@end

// React Native drops the Manager suffix: this registers MindboxEmbeddedBlockView, the name Fabric uses.
@interface MindboxEmbeddedBlockViewManager : RCTViewManager
@end

@implementation MindboxEmbeddedBlockViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [MindboxEmbeddedBlockPaperView new];
}

RCT_EXPORT_VIEW_PROPERTY(placeSystemName, NSString)
RCT_EXPORT_VIEW_PROPERTY(blockHeight, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(timeoutMs, double)
RCT_EXPORT_VIEW_PROPERTY(loadingStrategy, NSString)
RCT_EXPORT_VIEW_PROPERTY(animatesReveal, BOOL)
RCT_EXPORT_VIEW_PROPERTY(hasPlaceholder, BOOL)
RCT_EXPORT_VIEW_PROPERTY(hasErrorView, BOOL)
RCT_EXPORT_VIEW_PROPERTY(hostVisible, BOOL)

RCT_EXPORT_VIEW_PROPERTY(onAppearanceChange, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onBlockOutcome, RCTDirectEventBlock)

@end

#endif // RCT_NEW_ARCH_ENABLED
