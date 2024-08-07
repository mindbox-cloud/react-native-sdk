package com.exampleapp

import android.util.Log
import cloud.mindbox.mindbox_firebase.MindboxFirebase
import cloud.mindbox.mobile_sdk.Mindbox
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

// https://developers.mindbox.ru/docs/firebase-send-push-notifications-react-native
class MindboxFirebaseMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        Mindbox.updatePushToken(applicationContext, token, MindboxFirebase)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {

        val channelId = "default_channgel_id"
        val channelName = "default_channel_name"
        val channelDescription = "default_channel_description"
        val pushSmallIcon = R.mipmap.ic_launcher

        // The method returns a boolean to allow for a fallback in handling push notifications
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
        val mindboxMessage = MindboxFirebase.convertToMindboxRemoteMessage(remoteMessage)
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
