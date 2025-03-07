package com.exampleapp

import cloud.mindbox.mobile_sdk.Mindbox
import cloud.mindbox.mindbox_huawei.MindboxHuawei
import com.huawei.hms.push.*
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

// https://developers.mindbox.ru/docs/huawei-send-push-notifications-react-native
class MindboxHuaweiMessagingService : HmsMessageService() {

    private val coroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        // https://developers.mindbox.ru/docs/android-sdk-methods#updatepushtoken
        Mindbox.updatePushToken(applicationContext, token, MindboxHuawei)
    }


    override fun onMessageReceived(remoteMessage: RemoteMessage) {

        val channelId = "default_channel_id"
        val channelName = "default_channel_name"
        val channelDescription = "default_channel_description"
        val pushSmallIcon = R.mipmap.ic_launcher

        // The method returns a boolean to allow for a fallback in handling push notifications
        // On some devices, onMessageReceived may be executed on the main thread
        // We recommend handling push messages asynchronously
        coroutineScope.launch {
            val messageWasHandled = Mindbox.handleRemoteMessage(
                context = applicationContext,
                message = remoteMessage,
                activities = mapOf(),
                channelId = channelId,
                channelName = channelName,
                pushSmallIcon = pushSmallIcon,
                defaultActivity = MainActivity::class.java,
                channelDescription = channelDescription
            )

            // https://developers.mindbox.ru/docs/android-sdk-methods#converttomindboxremotemessage-since-284
            val mindboxMessage = MindboxHuawei.convertToMindboxRemoteMessage(remoteMessage)
            if (mindboxMessage != null) {
                val app = applicationContext as MainApplication
                app.saveNotification(mindboxMessage)
            }

            // If the push notification was not from Mindbox or contains incorrect data, a fallback can be implemented for its handling
            if (!messageWasHandled) {
                Log.d("PushNotification", "Received an unsupported or incorrect push notification.")
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        coroutineScope.cancel()
    }
}
