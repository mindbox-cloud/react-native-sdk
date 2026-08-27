package com.mindboxsdk.embedded

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/**
 * Where the block stands now. A state and not an event: the same value arrives more than once, and the
 * JS side keeps the last one it knew.
 */
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

/** The content is shown. */
internal class BlockLoadEvent(surfaceId: Int, viewTag: Int) : Event<BlockLoadEvent>(surfaceId, viewTag) {

    override fun getEventName(): String = EVENT_NAME

    override fun getEventData(): WritableMap = Arguments.createMap()

    companion object {
        const val EVENT_NAME = "topBlockLoad"
    }
}

/**
 * The place ended up without content. No payload yet — the reason for the failure is not something the
 * SDK tells apart today, and when it does it lands in this map.
 */
internal class BlockFailEvent(surfaceId: Int, viewTag: Int) : Event<BlockFailEvent>(surfaceId, viewTag) {

    override fun getEventName(): String = EVENT_NAME

    override fun getEventData(): WritableMap = Arguments.createMap()

    companion object {
        const val EVENT_NAME = "topBlockFail"
    }
}
