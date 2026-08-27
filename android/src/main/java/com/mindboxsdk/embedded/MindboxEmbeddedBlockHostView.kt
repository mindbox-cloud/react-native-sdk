package com.mindboxsdk.embedded

import android.content.Context
import android.graphics.Color
import android.view.View
import android.widget.FrameLayout
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import androidx.lifecycle.setViewTreeLifecycleOwner
import cloud.mindbox.mobile_sdk.annotations.InternalMindboxApi
import cloud.mindbox.mobile_sdk.embedded.MindboxEmbeddedBlockAppearance
import cloud.mindbox.mobile_sdk.embedded.MindboxEmbeddedBlockListener
import cloud.mindbox.mobile_sdk.embedded.MindboxEmbeddedBlockView

/**
 * The React Native side of one embedded block: a frame that holds the SDK's own container and turns
 * its two signals into RN events.
 *
 * The block itself is the SDK's `MindboxEmbeddedBlockView`, whole and unchanged — the content
 * factory, the waiting budget, the page and its bridge stay on the native side, and RN gets a view to
 * place plus the signals to react to.
 *
 * Why a frame around it rather than the block itself: the SDK block takes its place system name in
 * the constructor, and RN creates a view before it has any props. So the block is built once the
 * props of the first transaction are all in (see [commitProps]) and lives inside this frame.
 */
@OptIn(InternalMindboxApi::class)
internal class MindboxEmbeddedBlockHostView(context: Context) : FrameLayout(context) {

    /** Native → RN: where the block stands now, as one of the wire words. */
    var onAppearance: ((String) -> Unit)? = null

    /** Native → RN: how the load ended — `load` or `fail`. */
    var onOutcome: ((String) -> Unit)? = null

    private var blockView: MindboxEmbeddedBlockView? = null
    private var placeSystemName: String? = null
    private var timeoutMs: Long? = null
    private var hostVisible: Boolean = true
    private var hasPlaceholder: Boolean = false
    private var hasErrorView: Boolean = false

    /**
     * The stand-ins currently handed to the container, kept to tell "the host still draws its own
     * screen" from "it has just started to".
     */
    private var placeholderStandIn: View? = null
    private var errorStandIn: View? = null

    /**
     * The lifecycle the block reads as its host screen's.
     *
     * The container gives up for good when the lifecycle owner above it is destroyed — the right rule
     * for a native screen, and the wrong one here. React Native keeps this view across screens while
     * `react-native-screens` destroys the fragment of a screen that gets covered: the block would hear
     * its host die, free its page, and come back to a screen it can no longer load anything for. So the
     * block is told about the lifetime that actually matters — this view's own.
     */
    private val hostLifecycleOwner = object : LifecycleOwner {
        val registry: LifecycleRegistry = LifecycleRegistry(this)

        override val lifecycle: Lifecycle
            get() = registry
    }

    init {
        hostLifecycleOwner.registry.currentState = Lifecycle.State.RESUMED
        setViewTreeLifecycleOwner(hostLifecycleOwner)
    }

    /**
     * Lays the block out again after React Native has stopped listening.
     *
     * Yoga owns layout in RN, so the view groups on the way up answer `requestLayout()` with nothing.
     * The container swaps its own children as the block resolves — the shimmer for the page, the page
     * for the failure — and every child added after the last layout pass would stay at zero size: the
     * page loads, reports its content, and nobody ever sees it. So the frame measures and lays itself
     * out on the next turn of the looper, with the bounds RN gave it.
     */
    private val measureAndLayout = Runnable {
        isLayoutScheduled = false
        // `forceLayout` and not just `measure`: the container swaps a child while RN is already inside
        // its own layout pass, and that pass clears the flag `requestLayout` had set — a `measure` with
        // unchanged specs would then return without measuring anything, and the new child would keep
        // its zero size for good.
        forceLayout()
        measure(
            MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
            MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY),
        )
        layout(left, top, right, bottom)
    }

    private var isLayoutScheduled = false

    /** Whether RN has asked for a block at all — the props of the first transaction have landed. */
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
        val next = name?.takeIf { it.isNotBlank() }
        if (next == placeSystemName) {
            return
        }

        // A different place is a different block, and the old one has nothing to hand over. The
        // wrapper keys the whole component by the place, so this is a safety net and not the usual
        // path — but a place changed under a live block must not leave the old one running.
        placeSystemName = next
        dropBlock()
    }

    /**
     * The waiting budget the block is built with, in milliseconds as they came over the wire.
     *
     * Zero is the wire word for "the host said nothing" and turns back into the null the SDK
     * constructor reads as its own default; anything else — a negative included — is handed over as it
     * is, for the container to sanitize and log. A value that arrives after the block is built goes
     * nowhere: a running wait cannot be re-budgeted, the JS wrapper both freezes the value and warns,
     * and this is only the native end of that same rule.
     */
    fun setTimeoutMs(timeoutMs: Double) {
        if (blockView == null) {
            this.timeoutMs = timeoutMs.takeIf { it != 0.0 }?.toLong()
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

    /**
     * The props of a transaction are all in — the block can be built as soon as there is a frame to
     * build it in.
     *
     * Called from here and nowhere else: `createViewInstance` has no props yet, and a single prop
     * setter would build a block on the place system name while the stand-in flags were still the
     * defaults.
     */
    fun commitProps() {
        isBlockWanted = true
        buildBlockIfPossible()
    }

    /**
     * The frame has bounds now, which is what the block was waiting for.
     *
     * A block built before them starts its page in a view of zero size: the page lays itself out
     * against a zero-width viewport, reports content that occupies nothing, and a later resize does
     * not make it lay out again — the block reports `onLoad` for a feed nobody can see. RN gives a view
     * its bounds after the props, so the block waits for them.
     */
    override fun onSizeChanged(width: Int, height: Int, oldWidth: Int, oldHeight: Int) {
        super.onSizeChanged(width, height, oldWidth, oldHeight)
        buildBlockIfPossible()
    }

    /**
     * The container hands out its appearance the moment the observer subscribes — and a place with
     * nothing behind it settles right there — so subscribing happens before the block ever reaches the
     * window.
     */
    private fun buildBlockIfPossible() {
        val place = placeSystemName ?: return
        if (blockView != null || !isBlockWanted || width == 0 || height == 0) {
            return
        }

        val block = MindboxEmbeddedBlockView(context, place, timeoutMs)
        blockView = block

        syncStandIns()
        block.setHostVisible(hostVisible)
        block.setListener(
            object : MindboxEmbeddedBlockListener {
                override fun onLoad(view: MindboxEmbeddedBlockView) {
                    onOutcome?.invoke(OUTCOME_LOAD)
                }

                override fun onFail(view: MindboxEmbeddedBlockView) {
                    onOutcome?.invoke(OUTCOME_FAIL)
                }
            },
        )
        block.setAppearanceObserver { appearance -> onAppearance?.invoke(nameOf(appearance)) }

        // Last: attaching to the window is what starts the content, and by now everything that has an
        // opinion about it has been said.
        addView(block, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    }

    /**
     * The RN view is gone, so the block's screen is gone with it. Waiting for the host Activity to be
     * destroyed instead would keep a page loading for a screen nobody can see.
     */
    fun release() {
        dropBlock()
        onAppearance = null
        onOutcome = null
        // Now the host screen really is gone, and a block that outlived this call — one the platform
        // still holds a reference to — has to hear it.
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

    /**
     * Puts an empty view where the host draws its own screen — the same arrangement the Compose and
     * Flutter wrappers use for a slot they cannot hand over directly.
     *
     * RN children are real Android views, but the ones above this block belong to Fabric: it mounts
     * them, and Yoga lays them out. Handing them to the container would take them out of both. So the
     * container is not given the screen: it is given the fact that the place is taken. That is all it
     * needs — its own placeholder is held back, and a failed block keeps its height instead of
     * collapsing. What is actually drawn there is an RN overlay above this frame.
     */
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
        // The stand-in is a placeholder for space, not for touches: what the host drew over it is an
        // RN view, and it is RN that has to hear the taps on it.
        isClickable = false
        isFocusable = false
    }

    private companion object {

        const val OUTCOME_LOAD = "load"
        const val OUTCOME_FAIL = "fail"

        /**
         * Spelled out rather than taken from the enum name: the wire word is a contract with the JS
         * side, and renaming a case in the SDK must not quietly change it.
         */
        fun nameOf(appearance: MindboxEmbeddedBlockAppearance): String = when (appearance) {
            MindboxEmbeddedBlockAppearance.PLACEHOLDER -> "placeholder"
            MindboxEmbeddedBlockAppearance.CONTENT -> "content"
            MindboxEmbeddedBlockAppearance.ERROR -> "error"
            MindboxEmbeddedBlockAppearance.COLLAPSED -> "collapsed"
        }
    }
}
