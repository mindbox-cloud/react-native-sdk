package com.mindboxsdk.embedded

import android.content.Context
import android.graphics.Color
import android.view.View
import android.widget.FrameLayout
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import androidx.lifecycle.setViewTreeLifecycleOwner
import cloud.mindbox.mobile_sdk.Mindbox
import cloud.mindbox.mobile_sdk.annotations.InternalMindboxApi
import cloud.mindbox.mobile_sdk.embedded.MindboxEmbeddedBlockFailReason
import cloud.mindbox.mobile_sdk.embedded.MindboxEmbeddedBlockListener
import cloud.mindbox.mobile_sdk.embedded.MindboxEmbeddedBlockLoadingStrategy
import cloud.mindbox.mobile_sdk.embedded.MindboxEmbeddedBlockView
import cloud.mindbox.mobile_sdk.logger.Level

@OptIn(InternalMindboxApi::class)
internal class MindboxEmbeddedBlockHostView(context: Context) : FrameLayout(context) {
    /** The appearance word, whether this change is the SDK's animated reveal, and how long it takes. */
    var onAppearance: ((appearance: String, isRevealAnimated: Boolean, revealDurationMs: Int) -> Unit)? = null

    /** The outcome word and, for a failure, the reason's raw value. */
    var onOutcome: ((outcome: String, reason: String?) -> Unit)? = null

    private var blockView: MindboxEmbeddedBlockView? = null
    private var placeSystemName: String? = null
    private var timeoutMs: Long? = null
    private var loadingStrategy: MindboxEmbeddedBlockLoadingStrategy = MindboxEmbeddedBlockLoadingStrategy.AUTOMATIC
    private var animatesReveal: Boolean = true
    private var hostVisible: Boolean = true
    private var hasPlaceholder: Boolean = false
    private var hasErrorView: Boolean = false

    private var placeholderStandIn: View? = null
    private var errorStandIn: View? = null

    private val hostLifecycleOwner = object : LifecycleOwner {
        val registry: LifecycleRegistry = LifecycleRegistry(this)

        override val lifecycle: Lifecycle
            get() = registry
    }

    init {
        hostLifecycleOwner.registry.currentState = Lifecycle.State.RESUMED
        setViewTreeLifecycleOwner(hostLifecycleOwner)
    }

    private val measureAndLayout = Runnable {
        isLayoutScheduled = false
        forceLayout()
        measure(
            MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
            MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY),
        )
        layout(left, top, right, bottom)
    }

    private var isLayoutScheduled = false

    private var isBlockWanted = false

    override fun requestLayout() {
        super.requestLayout()

        if (isLayoutScheduled || width == 0 || height == 0) {
            return
        }

        isLayoutScheduled = true
        post(measureAndLayout)
    }

    fun setPlaceSystemName(name: String?) {
        if (name == placeSystemName) {
            return
        }

        placeSystemName = name
        dropBlock()
    }

    fun setTimeoutMs(timeoutMs: Double) {
        if (blockView == null) {
            this.timeoutMs = timeoutMs.takeIf { it != 0.0 }?.toLong()
        }
    }

    // Fixed at creation, as the timeout is: the JS side warns the host about a later value rather
    // than applying it, and the native block takes both only through its constructor.
    fun setLoadingStrategy(word: String?) {
        if (blockView != null) {
            return
        }

        val strategy = EmbeddedBlockWire.loadingStrategyOf(word)
        if (strategy == null) {
            Mindbox.writeLog(
                message = "[EmbeddedBlock] A React Native block for place '$placeSystemName' was given a loading strategy this SDK does not know ('$word') and starts as automatic",
                logLevel = Level.ERROR,
            )
        }
        loadingStrategy = strategy ?: MindboxEmbeddedBlockLoadingStrategy.AUTOMATIC
    }

    fun setAnimatesReveal(animatesReveal: Boolean) {
        if (blockView == null) {
            this.animatesReveal = animatesReveal
        }
    }

    fun setHostVisible(isHostVisible: Boolean) {
        if (hostVisible == isHostVisible) {
            return
        }

        hostVisible = isHostVisible
        blockView?.setHostVisible(isHostVisible)
    }

    fun setHasPlaceholder(hasPlaceholder: Boolean) {
        if (this.hasPlaceholder == hasPlaceholder) {
            return
        }

        this.hasPlaceholder = hasPlaceholder
        syncStandIns()
    }

    fun setHasErrorView(hasErrorView: Boolean) {
        if (this.hasErrorView == hasErrorView) {
            return
        }

        this.hasErrorView = hasErrorView
        syncStandIns()
    }

    fun commitProps() {
        isBlockWanted = true
        buildBlockIfPossible()
    }

    override fun onSizeChanged(width: Int, height: Int, oldWidth: Int, oldHeight: Int) {
        super.onSizeChanged(width, height, oldWidth, oldHeight)
        buildBlockIfPossible()
    }

    private fun buildBlockIfPossible() {
        val place = placeSystemName ?: return
        if (blockView != null || !isBlockWanted || width == 0 || height == 0) {
            return
        }

        if (place.isEmpty()) {
            Mindbox.writeLog(
                message = "[EmbeddedBlock] A React Native block was created without a place system name and has nothing to resolve",
                logLevel = Level.ERROR,
            )
        }

        val block = MindboxEmbeddedBlockView(
            context = context,
            placeSystemName = place,
            timeoutMs = timeoutMs,
            loadingStrategy = loadingStrategy,
            animatesReveal = animatesReveal,
        )
        blockView = block

        syncStandIns()
        block.setHostVisible(hostVisible)
        block.setListener(
            object : MindboxEmbeddedBlockListener {
                override fun onLoad(view: MindboxEmbeddedBlockView) {
                    onOutcome?.invoke(EmbeddedBlockWire.OUTCOME_LOAD, null)
                }

                override fun onEmpty(view: MindboxEmbeddedBlockView) {
                    onOutcome?.invoke(EmbeddedBlockWire.OUTCOME_EMPTY, null)
                }

                override fun onFail(view: MindboxEmbeddedBlockView, reason: MindboxEmbeddedBlockFailReason) {
                    onOutcome?.invoke(EmbeddedBlockWire.OUTCOME_FAIL, reason.value)
                }
            },
        )
        // `isRevealAnimated` is read while the observer runs: the block sets it right before it
        // calls, for that one call. The block owns the gates — `animatesReveal`, a window to animate
        // in, animations enabled on the device, "only the arrival of content" — and this host only
        // passes its word on; the growth of a block that waited hidden is then the JS side's.
        block.setAppearanceObserver { appearance ->
            onAppearance?.invoke(
                EmbeddedBlockWire.nameOf(appearance),
                block.isRevealAnimated,
                MindboxEmbeddedBlockView.REVEAL_ANIMATION_DURATION_MS.toInt(),
            )
        }

        addView(block, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    }

    fun release() {
        dropBlock()
        onAppearance = null
        onOutcome = null
        hostLifecycleOwner.registry.currentState = Lifecycle.State.DESTROYED
    }

    private fun dropBlock() {
        val block = blockView ?: return

        blockView = null
        placeholderStandIn = null
        errorStandIn = null
        block.setAppearanceObserver(null)
        block.setListener(null)
        block.release()
        removeView(block)
    }

    private fun syncStandIns() {
        val block = blockView ?: return

        if (hasPlaceholder) {
            if (placeholderStandIn == null) {
                placeholderStandIn = makeStandIn()
                block.setPlaceholderView(placeholderStandIn)
            }
        } else if (placeholderStandIn != null) {
            placeholderStandIn = null
            block.setPlaceholderView(null)
        }

        if (hasErrorView) {
            if (errorStandIn == null) {
                errorStandIn = makeStandIn()
                block.setErrorView(errorStandIn)
            }
        } else if (errorStandIn != null) {
            errorStandIn = null
            block.setErrorView(null)
        }
    }

    private fun makeStandIn(): View = View(context).apply {
        setBackgroundColor(Color.TRANSPARENT)
        isClickable = false
        isFocusable = false
    }
}
