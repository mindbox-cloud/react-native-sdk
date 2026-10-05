package com.mindboxsdk.embedded

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/**
 * The look the native block shows. `animated` is `true` for the one change that is the SDK's
 * reveal of content — the block owns that decision, gates included — and `revealDurationMs` is
 * how long it takes; `false` and `0` for every other change.
 */
internal class AppearanceChangeEvent(
    surfaceId: Int,
    viewTag: Int,
    private val appearance: String,
    private val isRevealAnimated: Boolean,
    private val revealDurationMs: Int,
) : Event<AppearanceChangeEvent>(surfaceId, viewTag) {
    override fun getEventName(): String = EVENT_NAME

    // React Native coalesces same-named events of one view that are still queued when a frame is
    // dispatched, keeping the last. The JS side reads every change — a reveal is content arriving
    // where a placeholder or nothing stood — so none may be folded into the next.
    override fun canCoalesce(): Boolean = false

    override fun getEventData(): WritableMap = Arguments.createMap().apply {
        putString("appearance", appearance)
        putBoolean("animated", isRevealAnimated)
        putInt("revealDurationMs", if (isRevealAnimated) revealDurationMs else 0)
    }

    companion object {
        const val EVENT_NAME = "topAppearanceChange"
    }
}

/**
 * How the load ended: `load`, `empty` or `fail`, the reason going with a failure. An event payload
 * has every field, so a missing reason is spelled as an empty string.
 */
internal class BlockOutcomeEvent(
    surfaceId: Int,
    viewTag: Int,
    private val outcome: String,
    private val reason: String?,
) : Event<BlockOutcomeEvent>(surfaceId, viewTag) {
    override fun getEventName(): String = EVENT_NAME

    // Every outcome is promised to the host once it changes; two in one frame must both arrive.
    override fun canCoalesce(): Boolean = false

    override fun getEventData(): WritableMap = Arguments.createMap().apply {
        putString("outcome", outcome)
        putString("reason", reason.orEmpty())
    }

    companion object {
        const val EVENT_NAME = "topBlockOutcome"
    }
}
