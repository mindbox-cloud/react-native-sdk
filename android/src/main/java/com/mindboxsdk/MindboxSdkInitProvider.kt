package com.mindboxsdk

import android.app.Application
import android.content.ContentProvider
import android.content.ContentValues
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import android.os.Bundle
import android.util.Log
import cloud.mindbox.mobile_sdk.pushes.MindboxPushService
import cloud.mindbox.mobile_sdk.Mindbox

internal class MindboxSdkInitProvider : ContentProvider() {

    companion object {
        private const val AUTO_INIT_ENABLED_KEY = "com.mindbox.sdk.AUTO_INIT_ENABLED"
        private const val TAG = "MindboxSdkInitProvider"
    }

    override fun onCreate(): Boolean {
        runCatching {
            Log.i(TAG, "onCreate initProvider.")
            (context?.applicationContext as? Application)?.let { application ->
                val meta = application.readMetaData()
                if (isAutoInitEnabled(application, meta)) {
                    Log.i(TAG, "Automatic initialization is enabled.")
                    Mindbox.initPushServices(application, MindboxPushServicesDiscovery(meta).services)
                    MindboxSdkLifecycleListener.register(application)
                } else {
                    Log.i(TAG, "Automatic initialization is disabled.")
                }
            }
        }.onFailure { error ->
            Log.e(TAG, "Automatic initialization failed", error)
        }
        return true
    }

    private fun isAutoInitEnabled(application: Application, metaData: Bundle?): Boolean =
        metaData
            ?.getBoolean(AUTO_INIT_ENABLED_KEY, false)
            ?: false

    private fun Application.readMetaData(): Bundle? = runCatching {
        packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA).metaData
    }.getOrNull()

    override fun query(
        uri: Uri,
        projection: Array<String>?,
        selection: String?,
        selectionArgs: Array<String>?,
        sortOrder: String?
    ): Cursor? = null

    override fun getType(uri: Uri): String? = null
    override fun insert(uri: Uri, values: ContentValues?): Uri? = null
    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<String>?): Int = 0
    override fun update(
        uri: Uri,
        values: ContentValues?,
        selection: String?,
        selectionArgs: Array<String>?
    ): Int = 0
}
