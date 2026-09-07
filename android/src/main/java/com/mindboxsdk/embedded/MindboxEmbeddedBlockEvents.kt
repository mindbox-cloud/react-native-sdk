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

internal class BlockLoadEvent(surfaceId: Int, viewTag: Int) : Event<BlockLoadEvent>(surfaceId, viewTag) {
    override fun getEventName(): String = EVENT_NAME

    override fun getEventData(): WritableMap = Arguments.createMap()

    companion object {
        const val EVENT_NAME = "topBlockLoad"
    }
}

internal class BlockFailEvent(surfaceId: Int, viewTag: Int) : Event<BlockFailEvent>(surfaceId, viewTag) {
    override fun getEventName(): String = EVENT_NAME

    override fun getEventData(): WritableMap = Arguments.createMap()

    companion object {
        const val EVENT_NAME = "topBlockFail"
    }
}
