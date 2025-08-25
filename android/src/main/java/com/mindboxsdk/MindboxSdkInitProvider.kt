package com.mindboxsdk

import android.app.Application
import android.content.ContentProvider
import android.content.ContentValues
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import android.util.Log

internal class MindboxSdkInitProvider : ContentProvider() {

    companion object {
        private const val AUTO_INIT_ENABLED_KEY = "com.mindbox.sdk.AUTO_INIT_ENABLED"
    }

    override fun onCreate(): Boolean {
        runCatching {
            Log.i("MindboxSdkInitProvider", "onCreate initProvider.")
            (context?.applicationContext as? Application)?.let { application ->
                if (isAutoInitEnabled(application)) {
                    Log.i("MindboxSdkInitProvider", "Automatic initialization is enabled.")
                    MindboxSdkLifecycleListener.register(application)
                } else {
                    Log.i("MindboxSdkInitProvider", "Automatic initialization is disabled.")
                }
            }
        }.onFailure { error ->
            Log.e("MindboxSdkInitProvider", "Automatic initialization failed", error)
        }
        return true
    }

    private fun isAutoInitEnabled(application: Application): Boolean =
        runCatching {
            val appInfo = application.packageManager.getApplicationInfo(
                application.packageName,
                PackageManager.GET_META_DATA
            )
            appInfo.metaData
                ?.getBoolean(AUTO_INIT_ENABLED_KEY, false)
                ?.also { Log.i("Mindbox", "Result of reading mindbox metadata is $it") }
                ?: false
        }.getOrElse { false }

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
