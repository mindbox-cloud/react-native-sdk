package com.mindboxsdk

import android.app.Activity
import android.app.Application
import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.ReactContext
import java.util.concurrent.atomic.AtomicBoolean
import cloud.mindbox.mobile_sdk.Mindbox
import cloud.mindbox.mobile_sdk.logger.Level
import cloud.mindbox.mobile_sdk.pushes.MindboxPushService


internal class MindboxSdkLifecycleListener private constructor(
    private val application: Application,
    private val subscriber: MindboxEventSubscriber
) : Application.ActivityLifecycleCallbacks {

    companion object {
        @Volatile
        private var listener: MindboxSdkLifecycleListener? = null

        fun register(
            application: Application,
            subscriber: MindboxEventSubscriber = MindboxEventEmitter(application)
        ) {
            if (listener == null) {
                synchronized(this) {
                    if (listener == null) {
                        Mindbox.writeLog("[RN] Initialize MindboxSdkLifecycleListener", Level.INFO)
                        val lifecycleListener = MindboxSdkLifecycleListener(application, subscriber)
                        application.registerActivityLifecycleCallbacks(lifecycleListener)
                        listener = lifecycleListener
                    }
                }
            }
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
        Mindbox.writeLog("[RN] ReactContext ready", Level.INFO)
        addActivityEventListener(reactContext)
        subscriber.onEvent(MindboxSdkLifecycleEvent.ActivityCreated(reactContext, activity))
    }

    private fun registerReactContextListener(
        application: Application,
        onReady: (ReactContext) -> Unit
    ) {
        val reactApplication = application.getReactApplication() ?: return
        val reactInstanceManager = getReactInstanceManager()

        val wrapperListener = object : ReactInstanceManager.ReactInstanceEventListener {
            private val called = AtomicBoolean(false)
            override fun onReactContextInitialized(context: ReactContext) {
                if (called.compareAndSet(false, true)) {
                    onReady(context)
                }
            }
        }

        reactInstanceManager?.addReactInstanceEventListener(wrapperListener)
        // RN 0.78+ introduced ReactHost.addReactInstanceEventListener(...).
        // Older RN versions (<= 0.74) expose only ReactInstanceManager.addReactInstanceEventListener(...).
        // In New Architecture the ReactInstanceManager listener might not fire
        // To support RN 0.78+ reliably while keeping backward compatibility,
        // we try to register via ReactHost using reflection (no compile-time dependency).
        // If ReactHost API is unavailable (older RN), this call is silently ignored and we rely on
        // the ReactInstanceManager path.
        addReactHostListener(application, wrapperListener)
    }

    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
        if (!isMainActivity(activity)) return

        getReactInstanceManager()?.currentReactContext?.let {
            onReactContextAvailable(it, activity)
            Mindbox.writeLog("[RN] ReactContext already available; skipping listener registration ", Level.INFO)
            return
        }

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
                            MindboxSdkLifecycleEvent.NewIntent(
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
        subscriber.onEvent(MindboxSdkLifecycleEvent.ActivityDestroyed(activity))
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

    private fun addReactHostListener(
        application: Application,
        wrapperListener: ReactInstanceManager.ReactInstanceEventListener
    ) {
        runCatching {
            val reactApplication = application as ReactApplication

            val hostClass = Class.forName("com.facebook.react.ReactHost")
            val listenerClass = Class.forName("com.facebook.react.ReactInstanceEventListener")

            val addMethod = hostClass.getMethod("addReactInstanceEventListener", listenerClass)
            val getHostMethod = reactApplication.javaClass.getMethod("getReactHost")
            val reactHost = getHostMethod.invoke(reactApplication)

            val proxy = java.lang.reflect.Proxy.newProxyInstance(
                listenerClass.classLoader,
                arrayOf(listenerClass)
            ) { _, method, args ->
                if (method.name == "onReactContextInitialized" && args?.size == 1 && args[0] is ReactContext) {
                    wrapperListener.onReactContextInitialized(args[0] as ReactContext)
                }
                null
            }

            addMethod.invoke(reactHost, proxy)
            Mindbox.writeLog("[RN] success added react context listener for reactHost", Level.INFO)
        }.onFailure {
            Mindbox.writeLog("[RN] failed added react context listener for reactHost ", Level.ERROR)
        }
    }
}

/**
 * Initializes push notification services for React Native integration.
 *
 * This method performs two crucial initialization steps:
 * 1. Initializes the specified push services (FCM, HMS, RuStore) through Mindbox SDK
 * 2. Registers the Mindbox lifecycle listener to handle React Native specific events
 *
 * @param application The Android Application context used for initialization
 * @param pushServices List of push notification services to initialize. Typically includes
 *                     [MindboxFirebase] for Firebase Cloud Messaging and/or
 *                     [MindboxHuawei] for Huawei Cloud Messaging and/or
 *                     [MindboxRuStore] for Huawei Cloud Messaging
 *
 * @example
 * // Typical usage:
 * Mindbox.initPushServicesForReactNative(
 *     application,
 *     listOf(MindboxFirebase, MindboxHuawei, MindboxRuStore)
 * )
 *
 * @note This method should be called once during application startup,
 *       in the Application.onCreate() method.
 */
public fun Mindbox.initPushServicesForReactNative(application: Application, pushServices: List<MindboxPushService>) {
    Mindbox.initPushServices(application, pushServices)
    MindboxSdkLifecycleListener.register(application)
}
