package com.mindboxsdk.embedded

import com.facebook.react.bridge.ReactContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.events.Event
import com.facebook.react.viewmanagers.MindboxEmbeddedBlockViewManagerDelegate
import com.facebook.react.viewmanagers.MindboxEmbeddedBlockViewManagerInterface

@ReactModule(name = MindboxEmbeddedBlockViewManager.NAME)
internal class MindboxEmbeddedBlockViewManager :
    SimpleViewManager<MindboxEmbeddedBlockHostView>(),
    MindboxEmbeddedBlockViewManagerInterface<MindboxEmbeddedBlockHostView> {
    private val managerDelegate = MindboxEmbeddedBlockViewManagerDelegate(this)

    override fun getDelegate(): ViewManagerDelegate<MindboxEmbeddedBlockHostView> = managerDelegate

    override fun getName(): String = NAME

    override fun createViewInstance(context: ThemedReactContext): MindboxEmbeddedBlockHostView =
        MindboxEmbeddedBlockHostView(context)

    override fun addEventEmitters(reactContext: ThemedReactContext, view: MindboxEmbeddedBlockHostView) {
        super.addEventEmitters(reactContext, view)
        view.onAppearance = { appearance, isRevealAnimated, revealDurationMs ->
            dispatch(view) { surfaceId, tag -> AppearanceChangeEvent(surfaceId, tag, appearance, isRevealAnimated, revealDurationMs) }
        }
        view.onOutcome = { outcome, reason ->
            dispatch(view) { surfaceId, tag -> BlockOutcomeEvent(surfaceId, tag, outcome, reason) }
        }
    }

    override fun onAfterUpdateTransaction(view: MindboxEmbeddedBlockHostView) {
        super.onAfterUpdateTransaction(view)
        view.commitProps()
    }

    override fun onDropViewInstance(view: MindboxEmbeddedBlockHostView) {
        view.release()
        super.onDropViewInstance(view)
    }

    override fun prepareToRecycleView(
        reactContext: ThemedReactContext,
        view: MindboxEmbeddedBlockHostView,
    ): MindboxEmbeddedBlockHostView? = null

    override fun setPlaceSystemName(view: MindboxEmbeddedBlockHostView, value: String?) {
        view.setPlaceSystemName(value)
    }

    override fun setBlockHeight(view: MindboxEmbeddedBlockHostView, value: Double) = Unit

    override fun setTimeoutMs(view: MindboxEmbeddedBlockHostView, value: Double) {
        view.setTimeoutMs(value)
    }

    override fun setLoadingStrategy(view: MindboxEmbeddedBlockHostView, value: String?) {
        view.setLoadingStrategy(value)
    }

    override fun setAnimatesReveal(view: MindboxEmbeddedBlockHostView, value: Boolean) {
        view.setAnimatesReveal(value)
    }

    override fun setHasPlaceholder(view: MindboxEmbeddedBlockHostView, value: Boolean) {
        view.setHasPlaceholder(value)
    }

    override fun setHasErrorView(view: MindboxEmbeddedBlockHostView, value: Boolean) {
        view.setHasErrorView(value)
    }

    override fun setHostVisible(view: MindboxEmbeddedBlockHostView, value: Boolean) {
        view.setHostVisible(value)
    }

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> = mutableMapOf(
        AppearanceChangeEvent.EVENT_NAME to mutableMapOf("registrationName" to "onAppearanceChange"),
        BlockOutcomeEvent.EVENT_NAME to mutableMapOf("registrationName" to "onBlockOutcome"),
    )

    private inline fun dispatch(
        view: MindboxEmbeddedBlockHostView,
        event: (surfaceId: Int, viewTag: Int) -> Event<*>,
    ) {
        val reactContext = view.context as? ReactContext ?: return
        val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id) ?: return
        dispatcher.dispatchEvent(event(UIManagerHelper.getSurfaceId(view), view.id))
    }

    internal companion object {
        const val NAME = "MindboxEmbeddedBlockView"
    }
}
