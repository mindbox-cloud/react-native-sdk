package com.exampleapp

import cloud.mindbox.mindbox_rustore.MindboxRuStore
import cloud.mindbox.mobile_sdk.Mindbox
import kotlinx.coroutines.*
import ru.rustore.sdk.pushclient.messaging.model.RemoteMessage
import ru.rustore.sdk.pushclient.messaging.service.RuStoreMessagingService

class MindboxRuStoreMessagingService: RuStoreMessagingService() {

    private val coroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Mindbox.updatePushToken(applicationContext, token, MindboxRuStore)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        val channelId = "default_channel_id"
        val channelName = "default_channel_name"
        val channelDescription = "default_channel_description"
        val pushSmallIcon = android.R.drawable.ic_dialog_info

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

            // Method for checking if push is from Mindbox
            val isMindboxPush = MindboxRuStore.isMindboxPush(remoteMessage = remoteMessage)

            // Method for getting info from Mindbox push
            val mindboxMessage =
                MindboxRuStore.convertToMindboxRemoteMessage(remoteMessage = remoteMessage)
            // If you want to save the notification you can call your save function from here.
            mindboxMessage?.let {
                val app = applicationContext as MainApplication
                app.saveNotification(it)
            }

            if (!messageWasHandled) {
                //If the push notification was not from Mindbox or it contains incorrect data, then you can write a fallback to process it
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        coroutineScope.cancel()
    }
}
