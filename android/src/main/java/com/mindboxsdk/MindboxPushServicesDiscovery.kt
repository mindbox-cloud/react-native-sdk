package com.mindboxsdk

import android.os.Bundle
import android.util.Log
import cloud.mindbox.mobile_sdk.pushes.MindboxPushService

internal class MindboxPushServicesDiscovery(private val meta: Bundle?) {

    companion object {
        private const val TAG = "MindboxPushServicesDiscovery"
        private const val PUSH_PROVIDER_PREFIX = "cloud.mindbox.push.provider."
    }

    private val providerPriority: Map<String, Int> by lazy(LazyThreadSafetyMode.NONE) {
        mapOf("FCM" to 0, "HCM" to 1, "RuStore" to 2)
    }

    val services: List<MindboxPushService> by lazy(LazyThreadSafetyMode.NONE) {
        if (meta == null) {
            return@lazy emptyList()
        }
        meta.keySet()
            .asSequence()
            .filter { it.startsWith(PUSH_PROVIDER_PREFIX) }
            .mapNotNull { key -> meta.getString(key)?.takeIf { it.isNotBlank() } }
            .mapNotNull { className -> loadPushService(className) }
            .distinctBy { it::class.java.name }
            .sortedWith(
                compareBy<MindboxPushService> { providerPriority[it.tag] ?: Int.MAX_VALUE }
                    .thenBy { it.tag }
            )
            .toList()
            .also { list ->
                Log.i(TAG, "Found ${list.size} push services: ${list.joinToString { it.tag }}")
                list
            }
    }

    private fun loadPushService(className: String): MindboxPushService? {
        return runCatching {
            val clazz = Class.forName(className)

            if (!MindboxPushService::class.java.isAssignableFrom(clazz)) {
                Log.w(TAG, "Class $className does not implement MindboxPushService")
                return@runCatching null
            }
            getPushServiceInstance(clazz)?.also {
                Log.i(TAG, "Loaded push provider: $className")
            } ?: run {
                Log.e(TAG, "Failed to create instance for provider: $className")
                null
            }
        }.getOrElse { exception ->
            when (exception) {
                is ClassNotFoundException -> Log.e(TAG, "Push provider class not found: $className", exception)
                else -> Log.e(TAG, "Failed to load push provider: $className", exception)
            }
            null
        }
    }

    private fun getPushServiceInstance(clazz: Class<*>): MindboxPushService? {
        return runCatching {
            val instanceField = clazz.getDeclaredField("INSTANCE")
            instanceField.isAccessible = true
            instanceField.get(null) as? MindboxPushService
        }.getOrElse {
            Log.w(TAG, "Failed to get instance for ${clazz.name}")
            null
        }
    }
}
