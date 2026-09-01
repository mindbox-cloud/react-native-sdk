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

/**
 * The embedded block as a Fabric component.
 *
 * The block itself lives in `MindboxEmbeddedBlockHost` — Swift, because the wrapper API of the native
 * SDK is behind `@_spi(Internal)`. This view is the part that has to be Objective-C++: the base class
 * and the generated event emitters are C++.
 */
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

    /// What the block said before there was an event emitter to say it to. See `updateEventEmitter:`.
    NSString *_pendingAppearance;
    NSString *_pendingOutcome;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<MindboxEmbeddedBlockViewComponentDescriptor>();
}

/**
 * Never recycled.
 *
 * Fabric would hand this view to another place, and the block inside it cannot be revived — `tearDown`
 * is one way. Creating the block with the view and killing it with the view is what keeps the lifecycle
 * here simple, and a pooled empty container buys nothing.
 */
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
        // A different place is a different block, and the old one has nothing to hand over. The JS
        // wrapper keys the whole component by the place, so this is a safety net rather than the usual
        // path — but a place changed under a live block must not leave the old one running.
        _placeSystemName = next.placeSystemName;
        [self dropHost];
    }

    _blockHeight = next.blockHeight;
    // Read on every update, used once: the block takes its budget when it is built, in
    // `finalizeUpdates:`, and a running wait cannot be re-budgeted. The JS wrapper freezes the value
    // and warns about a change; a change that reaches this far simply lands after the one read.
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

/**
 * The block is built here and not in `updateProps:`.
 *
 * Mounting applies the props first and the event emitter after them, and the container hands out its
 * appearance the moment the observer subscribes — a place with nothing behind it settles right there. A
 * block built while applying props would report its whole life to nobody. By `finalizeUpdates:` the
 * emitter and the layout metrics are both in.
 *
 * An empty place system name is a name like any other here: the container resolves a nameless place as
 * an empty one and answers `collapsed` and a failure, which is the host's cue to give the space back.
 * Refusing to build the block instead would leave the place taken for the life of the screen, with
 * nothing ever reported — the one outcome a host cannot lay out around.
 */
- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask
{
    [super finalizeUpdates:updateMask];

    // A frame of no size is no time to start: a page laid out against a zero viewport does not lay
    // itself out again when the space arrives, and the block would report content nobody can see. This
    // is not a refusal for good — a change of layout metrics is a reason for another `finalizeUpdates:`
    // on its own, and the metrics land before it, so the first frame with a size builds the block. The
    // same guard Android keeps in `MindboxEmbeddedBlockHostView.buildBlockIfPossible`.
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

    // `contentView` and not `addSubview:`: this is the one subview Fabric keeps sized to the view's
    // content frame, so the block follows whatever height the style gives it. The frame is the host's
    // business, not the block's — the container sizes itself by `intrinsicContentSize` for a native
    // host, and here RN owns the layout.
    self.contentView = _host.view;
}

- (void)updateEventEmitter:(const EventEmitter::Shared &)eventEmitter
{
    [super updateEventEmitter:eventEmitter];

    // Whatever the block reported before this point had nowhere to go. It reports states and not
    // deltas, so replaying the last one says everything.
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

/**
 * The view has been unmounted, and it is not going to a recycle pool — `shouldBeRecycled` says so, and
 * that is exactly why React Native calls this and not `prepareForRecycle`.
 *
 * The block's screen ends here, not whenever the last reference to the view is let go: waiting for
 * `dealloc` would leave the page alive for an autorelease pool to decide about. Android tears the block
 * down at the same moment, in `onDropViewInstance`.
 */
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
    // Whatever the old block had left to say goes with it: held back, it would be replayed to the next
    // event emitter as the outcome of the place that took its seat.
    _pendingAppearance = nil;
    _pendingOutcome = nil;
}

@end

Class<RCTComponentViewProtocol> MindboxEmbeddedBlockViewCls(void)
{
    return MindboxEmbeddedBlockViewComponentView.class;
}
