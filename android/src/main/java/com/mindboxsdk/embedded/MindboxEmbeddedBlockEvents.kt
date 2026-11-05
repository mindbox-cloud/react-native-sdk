package com.mindboxsdk.embedded

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

internal class AppearanceChangeEvent(
    surfaceId: Int,
    viewTag: Int,
    private val appearance: String,
    private val isRevealAnimated: Boolean,
    private val revealDurationMs: Int,
) : Event<AppearanceChangeEvent>(surfaceId, viewTag) {
    override fun getEventName(): String = EVENT_NAME

    // React Native keeps only the last queued event of a name per view; JS needs every look change.
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

internal class BlockOutcomeEvent(
    surfaceId: Int,
    viewTag: Int,
    private val outcome: String,
    private val reason: String?,
) : Event<BlockOutcomeEvent>(surfaceId, viewTag) {
    override fun getEventName(): String = EVENT_NAME

    // React Native keeps only the last queued event of a name per view; JS needs every outcome.
    override fun canCoalesce(): Boolean = false

    override fun getEventData(): WritableMap = Arguments.createMap().apply {
        putString("outcome", outcome)
        putString("reason", reason.orEmpty())
    }

    companion object {
        const val EVENT_NAME = "topBlockOutcome"
    }
}
