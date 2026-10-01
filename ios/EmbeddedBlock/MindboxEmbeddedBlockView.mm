// The embedded block on iOS, in both renderers.
//
// The block itself lives in `MindboxEmbeddedBlockHost` — plain UIKit, no React in it — and each
// renderer only carries props to it and its two signals back — the look and the outcome. Fabric does that through a component
// view and a C++ event emitter; the old renderer through a view manager and direct event blocks.
// The order of the calls into the host is kept the same in both, so a block behaves the same way
// whichever renderer the host app runs.

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

    NSString *_pendingAppearance;
    BOOL _pendingAppearanceAnimated;
    NSInteger _pendingAppearanceRevealDurationMs;
    NSString *_pendingOutcome;
    NSString *_pendingOutcomeReason;
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

    _host = [[MindboxEmbeddedBlockHost alloc] initWithPlaceSystemName:@(_placeSystemName.c_str())
                                                              height:_blockHeight
                                                           timeoutMs:_timeoutMs
                                                     loadingStrategy:@(_loadingStrategy.c_str())
                                                      animatesReveal:_animatesReveal];
    [_host setStandInsWithHasPlaceholder:_hasPlaceholder hasErrorView:_hasErrorView];
    [_host setHostVisible:_isHostVisible];

    __weak MindboxEmbeddedBlockViewComponentView *weakSelf = self;
    _host.onAppearance = ^(NSString *appearance, BOOL animated, NSInteger revealDurationMs) {
        [weakSelf emitAppearance:appearance animated:animated revealDurationMs:revealDurationMs];
    };
    _host.onOutcome = ^(NSString *outcome, NSString *_Nullable reason) {
        [weakSelf emitOutcome:outcome reason:reason];
    };

    self.contentView = _host.view;
}

- (void)updateEventEmitter:(const EventEmitter::Shared &)eventEmitter
{
    [super updateEventEmitter:eventEmitter];

    if (_pendingAppearance != nil) {
        NSString *appearance = _pendingAppearance;
        _pendingAppearance = nil;
        [self emitAppearance:appearance animated:_pendingAppearanceAnimated revealDurationMs:_pendingAppearanceRevealDurationMs];
    }

    if (_pendingOutcome != nil) {
        NSString *outcome = _pendingOutcome;
        NSString *reason = _pendingOutcomeReason;
        _pendingOutcome = nil;
        _pendingOutcomeReason = nil;
        [self emitOutcome:outcome reason:reason];
    }
}

- (void)invalidate
{
    [self dropHost];
    _placeSystemName = "";
}

- (void)emitAppearance:(NSString *)appearance animated:(BOOL)animated revealDurationMs:(NSInteger)revealDurationMs
{
    if (!_eventEmitter) {
        _pendingAppearance = appearance;
        _pendingAppearanceAnimated = animated;
        _pendingAppearanceRevealDurationMs = revealDurationMs;
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
        _pendingOutcome = outcome;
        _pendingOutcomeReason = reason;
        return;
    }

    // The payload has every field: a reason that is not there is an empty string.
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
    _pendingAppearance = nil;
    _pendingOutcome = nil;
    _pendingOutcomeReason = nil;
}

@end

Class<RCTComponentViewProtocol> MindboxEmbeddedBlockViewCls(void)
{
    return MindboxEmbeddedBlockViewComponentView.class;
}

#else // RCT_NEW_ARCH_ENABLED

#import <React/RCTView.h>
#import <React/RCTViewManager.h>

/**
 * The block's place in the old renderer.
 *
 * An `RCTView` and not a bare `UIView`: the view manager the block is exported through is an
 * `RCTViewManager`, and the standard view props it brings — the border, the shadow, the overflow —
 * are written to an `RCTView`.
 *
 * The host is built once the place has both its props and a size, which is why the attempt is made
 * from `didSetProps:` and from `layoutSubviews`: the props of a transaction and the frame of a
 * layout pass do not arrive together, and either can be the last of the two. This is what
 * `finalizeUpdates:` does for the block under Fabric.
 */
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

    // A different name is a different block, built from scratch in place of the old one — the same
    // rule the JS side states and the Fabric path follows.
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
    // Taken once, when the block is created: the container cannot re-budget a running wait, and the
    // JS side warns the host about a new value rather than applying it.
    _builtTimeoutMs = _timeoutMs;

    // The strategy and the animation flag are taken once as well: the native block takes them only
    // through its initializer.
    _host = [[MindboxEmbeddedBlockHost alloc] initWithPlaceSystemName:_builtPlaceSystemName
                                                              height:_blockHeight
                                                           timeoutMs:_builtTimeoutMs
                                                     loadingStrategy:_loadingStrategy ?: @""
                                                      animatesReveal:_animatesReveal];
    [_host setStandInsWithHasPlaceholder:_hasPlaceholder hasErrorView:_hasErrorView];
    [_host setHostVisible:_hostVisible];

    __weak MindboxEmbeddedBlockPaperView *weakSelf = self;
    _host.onAppearance = ^(NSString *appearance, BOOL animated, NSInteger revealDurationMs) {
        MindboxEmbeddedBlockPaperView *strongSelf = weakSelf;
        if (strongSelf.onAppearanceChange != nil) {
            strongSelf.onAppearanceChange(@{
                @"appearance" : appearance,
                @"animated" : @(animated),
                @"revealDurationMs" : @(animated ? revealDurationMs : 0),
            });
        }
    };
    _host.onOutcome = ^(NSString *outcome, NSString *_Nullable reason) {
        MindboxEmbeddedBlockPaperView *strongSelf = weakSelf;
        if (strongSelf.onBlockOutcome != nil) {
            // The same shape as under Fabric: every field present, a missing reason is empty.
            strongSelf.onBlockOutcome(@{@"outcome" : outcome, @"reason" : reason ?: @""});
        }
    };

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

/**
 * The exported component. React Native drops the `Manager` suffix when it names the component, so
 * this is the `MindboxEmbeddedBlockView` the JS side asks for — the same name Fabric registers.
 */
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
