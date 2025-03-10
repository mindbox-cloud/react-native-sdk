import { NativeModules, NativeEventEmitter } from 'react-native'
import React, { useEffect, useState } from 'react'
import { View, Text, Button, FlatList, StyleSheet } from 'react-native'
import NotificationItem from '../components/NotificationItem'
import { asyncOperationNCPushOpen } from '../utils/MindboxOperations'
import initialNotifications from '../utils/NotificationStub'
import styles from '../components/NotificationScreenStyles'
import { Notification } from '../utils/Notification'

const { NotificationModule } = NativeModules
const notificationEmitter = new NativeEventEmitter(NotificationModule)

const NotificationCenterScreen = ({ navigation }: { navigation: any }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    loadNotifications()

    const subscription = notificationEmitter.addListener('newNotification', () => {
      loadNotifications()
    })

    return () => {
      subscription.remove()
    }
  }, [])

  const loadNotifications = async () => {
    try {
      const result = await NotificationModule.getNotifications()
      const notificationStrings = JSON.parse(result)
      const notificationList = notificationStrings.map((notificationString: string) => {
        const notification = JSON.parse(notificationString)
        /*
        Assuming payload of push notification has this structure:
           {"pushName":"<Push name>",
            "pushDate":"<Push date>"
            }
        */
        if (notification.payload) {
          const payload = JSON.parse(notification.payload)
          notification.pushName = payload.pushName
          notification.pushDate = payload.pushDate
        } else {
          notification.pushName = ''
          notification.pushDate = ''
        }
        return notification
      })
      setNotifications([...initialNotifications, ...notificationList].reverse())
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  const clearNotifications = async () => {
    try {
      await NotificationModule.clearNotifications()
      setNotifications(initialNotifications.reverse())
    } catch (error) {
      console.error('Failed to clear notifications:', error)
    }
  }

  const handlePushClick = (pushName: string, pushDate: string) => {
    asyncOperationNCPushOpen(pushName, pushDate)
  }
  return (
    <View style={styles.container}>
      <FlatList data={notifications} keyExtractor={(item) => item.uniqueKey} renderItem={({ item }) => <NotificationItem notification={item} onPushClick={() => handlePushClick(item.pushName, item.pushDate)} />} />
      <View style={styles.buttonContainer}>
        <View style={styles.buttonWrapper}>
          <Button title="Clear Notification" onPress={clearNotifications} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </View>
    </View>
  )
}

export default NotificationCenterScreen
