import React from 'react'
import { View, Text, TouchableOpacity, Image } from 'react-native'
import styles from './NotificationItemStyle'

interface NotificationItemProps {
  notification: {
    uniqueKey: string
    title: string
    description: string
    imageUrl?: string
    pushLink: string
    pushName: string
    pushDate: string
  }
  onPushClick: () => void
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPushClick }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPushClick}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{notification.uniqueKey}</Text>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.description}>{notification.description}</Text>
      </View>
      {notification.imageUrl ? <Image source={{ uri: notification.imageUrl }} style={styles.image} /> : null}
    </TouchableOpacity>
  )
}

export default NotificationItem
