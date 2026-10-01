package com.mindboxsdk.embedded

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

internal class AppearanceChangeEvent(
    surfaceId: Int,
    viewTag: Int,
    private val appearance: String,
) : Event<AppearanceChangeEvent>(surfaceId, viewTag) {
    override fun getEventName(): String = EVENT_NAME

    override fun getEventData(): WritableMap = Arguments.createMap().apply {
        putString("appearance", appearance)
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

    override fun getEventData(): WritableMap = Arguments.createMap().apply {
        putString("outcome", outcome)
        putString("reason", reason.orEmpty())
    }

    companion object {
        const val EVENT_NAME = "topBlockOutcome"
    }
}
