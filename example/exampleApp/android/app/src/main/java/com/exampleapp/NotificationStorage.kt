package com.exampleapp

import android.content.Context
import cloud.mindbox.mobile_sdk.pushes.MindboxRemoteMessage
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.lang.reflect.Type

object NotificationStorage {
    private const val PREFERENCES_NAME: String = "notifications"
    private const val NOTIFICATIONS_KEY: String = "notifications"
    private const val EMPTY_NOTIFICATIONS_JSON: String = "[]"
    private val gson: Gson = Gson()
    private val notificationListType: Type = object : TypeToken<MutableList<String>>() {}.type

    @Synchronized
    fun saveNotification(context: Context, message: MindboxRemoteMessage) {
        val notifications: MutableList<String> = readNotifications(context).toMutableList()
        notifications.add(gson.toJson(message))
        context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(NOTIFICATIONS_KEY, gson.toJson(notifications))
            .apply()
    }

    @Synchronized
    fun getNotificationsJson(context: Context): String {
        return context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
            .getString(NOTIFICATIONS_KEY, EMPTY_NOTIFICATIONS_JSON)
            ?: EMPTY_NOTIFICATIONS_JSON
    }

    @Synchronized
    fun clearNotifications(context: Context) {
        context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(NOTIFICATIONS_KEY, EMPTY_NOTIFICATIONS_JSON)
            .apply()
    }

    private fun readNotifications(context: Context): List<String> {
        val notificationsJson: String = getNotificationsJson(context)
        return runCatching {
            gson.fromJson<MutableList<String>>(notificationsJson, notificationListType)
        }.getOrNull() ?: emptyList()
    }
}
