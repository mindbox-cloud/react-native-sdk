package com.mindboxsdk

import android.app.Activity
import android.app.Application
import android.content.Intent
import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.ReactHost
import java.util.concurrent.atomic.AtomicBoolean


internal class MindboxSdkLifecycleListener private constructor(
    private val application: Application,
    private val subscriber: MindboxEventSubscriber
) : Application.ActivityLifecycleCallbacks {

    companion object {
        fun register(
            application: Application,
            subscriber: MindboxEventSubscriber = MindboxEventEmitter(application)
        ) {
            val listener = MindboxSdkLifecycleListener(application, subscriber)
            application.registerActivityLifecycleCallbacks(listener)
        }
    }

    private val mainActivityClassName: String? by lazy { getLauncherActivityClassName() }

    private fun getLauncherActivityClassName(): String? {
        val pm = application.packageManager
        val intent = pm.getLaunchIntentForPackage(application.packageName)
        return intent?.component?.className
    }

    private fun isMainActivity(activity: Activity): Boolean {
        return activity.javaClass.name == mainActivityClassName
    }

    private var activityEventListener: ActivityEventListener? = null

    private fun onReactContextAvailable(reactContext: ReactContext, activity: Activity) {
        Log.i("Mindbox", "Context avialable")
        addActivityEventListener(reactContext)
        subscriber.onEvent(MindboxSdkLifecyceEvent.ActivityCreated(reactContext, activity))
    }

    private fun registerReactContextListener(
        application: Application,
        onReady: (ReactContext) -> Unit
    ) {
        val reactApplication = application.getReactApplication() ?: return
        val reactInstanceManager = getReactInstanceManager()
        val reactHost = reactApplication.reactHost

        val wrapperListener = object : ReactInstanceManager.ReactInstanceEventListener {
            private val called = AtomicBoolean(false)
            override fun onReactContextInitialized(context: ReactContext) {
                if (called.compareAndSet(false, true)) {
                    onReady(context)
                }
            }
        }

        reactInstanceManager?.addReactInstanceEventListener(wrapperListener)

        runCatching {
            reactHost?.addReactInstanceEventListener(wrapperListener)
        }
    }

    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
        if (!isMainActivity(activity)) return
        registerReactContextListener(application) { reactContext ->
            onReactContextAvailable(reactContext, activity)
        }
    }

    private fun addActivityEventListener(reactContext: ReactContext) {
        activityEventListener?.let { reactContext.removeActivityEventListener(it) }

        activityEventListener = object : ActivityEventListener {
            override fun onNewIntent(intent: Intent?) {
                intent ?: return
                reactContext.currentActivity
                    ?.takeIf { isMainActivity(it) }
                    ?.let {
                        subscriber.onEvent(
                            MindboxSdkLifecyceEvent.NewIntent(
                                reactContext,
                                intent
                            )
                        )
                    }
            }

            override fun onActivityResult(
                activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?
            ) {
            }
        }
        reactContext.addActivityEventListener(activityEventListener)
    }

    override fun onActivityDestroyed(activity: Activity) {
        if (!isMainActivity(activity)) return
        subscriber.onEvent(MindboxSdkLifecyceEvent.ActivityDestroyed(activity))
        getReactInstanceManager()
            ?.currentReactContext
            ?.removeActivityEventListener(activityEventListener)
        activityEventListener = null
    }

    override fun onActivityStarted(activity: Activity) {}
    override fun onActivityResumed(activity: Activity) {}
    override fun onActivityPaused(activity: Activity) {}
    override fun onActivityStopped(activity: Activity) {}
    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}


    private fun getReactInstanceManager(): ReactInstanceManager? =
        application.getReactApplication()?.reactNativeHost?.reactInstanceManager

    private fun Application.getReactApplication() = this as? ReactApplication

}
