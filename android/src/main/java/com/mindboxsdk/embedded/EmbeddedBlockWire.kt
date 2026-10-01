package com.mindboxsdk.embedded

import cloud.mindbox.mobile_sdk.annotations.InternalMindboxApi
import cloud.mindbox.mobile_sdk.embedded.MindboxEmbeddedBlockAppearance
import cloud.mindbox.mobile_sdk.embedded.MindboxEmbeddedBlockLoadingStrategy

/**
 * The words the block speaks to JS in: the same ones on iOS, the same ones the Flutter plugin
 * uses. A contract with the JS side, not derived from anything.
 */
@OptIn(InternalMindboxApi::class)
internal object EmbeddedBlockWire {
    const val OUTCOME_LOAD = "load"
    const val OUTCOME_EMPTY = "empty"
    const val OUTCOME_FAIL = "fail"

    /** `null` for a word this SDK does not know; an empty word is the default, `automatic`. */
    fun loadingStrategyOf(word: String?): MindboxEmbeddedBlockLoadingStrategy? = when (word) {
        null, "", "automatic" -> MindboxEmbeddedBlockLoadingStrategy.AUTOMATIC
        "placeholder" -> MindboxEmbeddedBlockLoadingStrategy.PLACEHOLDER
        "hidden" -> MindboxEmbeddedBlockLoadingStrategy.HIDDEN
        else -> null
    }

    fun nameOf(appearance: MindboxEmbeddedBlockAppearance): String = when (appearance) {
        MindboxEmbeddedBlockAppearance.PLACEHOLDER -> "placeholder"
        MindboxEmbeddedBlockAppearance.CONTENT -> "content"
        MindboxEmbeddedBlockAppearance.ERROR -> "error"
        MindboxEmbeddedBlockAppearance.COLLAPSED -> "collapsed"
    }
}
