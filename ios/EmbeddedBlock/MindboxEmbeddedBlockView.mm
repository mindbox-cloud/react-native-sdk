#import <React/RCTViewComponentView.h>

#import <react/renderer/components/MindboxSdkSpec/ComponentDescriptors.h>
#import <react/renderer/components/MindboxSdkSpec/EventEmitters.h>
#import <react/renderer/components/MindboxSdkSpec/Props.h>
#import <react/renderer/components/MindboxSdkSpec/RCTComponentViewHelpers.h>

#if __has_include("MindboxSdk-Swift.h")
#import "MindboxSdk-Swift.h"
#elif __has_include(<MindboxSdk/MindboxSdk-Swift.h>)
#import <MindboxSdk/MindboxSdk-Swift.h>
#else
#error "MindboxSdk-Swift.h not found. Ensure Swift sources are included in the MindboxSdk pod target."
#endif

using namespace facebook::react;

@interface MindboxEmbeddedBlockViewComponentView : RCTViewComponentView <RCTMindboxEmbeddedBlockViewViewProtocol>
@end

@implementation MindboxEmbeddedBlockViewComponentView {
    MindboxEmbeddedBlockHost *_host;

    std::string _placeSystemName;
    CGFloat _blockHeight;
    double _timeoutMs;
    BOOL _hasPlaceholder;
    BOOL _hasErrorView;
    BOOL _isHostVisible;

    NSString *_pendingAppearance;
    NSString *_pendingOutcome;
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
                                                           timeoutMs:_timeoutMs];
    [_host setStandInsWithHasPlaceholder:_hasPlaceholder hasErrorView:_hasErrorView];
    [_host setHostVisible:_isHostVisible];

    __weak MindboxEmbeddedBlockViewComponentView *weakSelf = self;
    _host.onAppearance = ^(NSString *appearance) {
        [weakSelf emitAppearance:appearance];
    };
    _host.onOutcome = ^(NSString *outcome) {
        [weakSelf emitOutcome:outcome];
    };

    self.contentView = _host.view;
}

- (void)updateEventEmitter:(const EventEmitter::Shared &)eventEmitter
{
    [super updateEventEmitter:eventEmitter];

    if (_pendingAppearance != nil) {
        NSString *appearance = _pendingAppearance;
        _pendingAppearance = nil;
        [self emitAppearance:appearance];
    }

    if (_pendingOutcome != nil) {
        NSString *outcome = _pendingOutcome;
        _pendingOutcome = nil;
        [self emitOutcome:outcome];
    }
}

- (void)invalidate
{
    [self dropHost];
    _placeSystemName = "";
}

- (void)emitAppearance:(NSString *)appearance
{
    if (!_eventEmitter) {
        _pendingAppearance = appearance;
        return;
    }

    std::static_pointer_cast<const MindboxEmbeddedBlockViewEventEmitter>(_eventEmitter)
        ->onAppearanceChange({.appearance = std::string([appearance UTF8String])});
}

- (void)emitOutcome:(NSString *)outcome
{
    if (!_eventEmitter) {
        _pendingOutcome = outcome;
        return;
    }

    const auto emitter = std::static_pointer_cast<const MindboxEmbeddedBlockViewEventEmitter>(_eventEmitter);
    if ([outcome isEqualToString:@"load"]) {
        emitter->onBlockLoad({});
    } else {
        emitter->onBlockFail({});
    }
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
}

@end

Class<RCTComponentViewProtocol> MindboxEmbeddedBlockViewCls(void)
{
    return MindboxEmbeddedBlockViewComponentView.class;
}
