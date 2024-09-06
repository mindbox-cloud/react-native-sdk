package com.exampleapp

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

// https://developers.mindbox.ru/docs/firebase-send-push-notifications-react-native
class MindboxFirebaseMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
    }
}
