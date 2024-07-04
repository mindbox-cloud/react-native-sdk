import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, NativeEventEmitter, NativeModules, StyleSheet } from 'react-native';
import NotificationItem from '../components/NotificationItem';
import { asyncOperationNCPushOpen } from '../utils/MindboxOperations';

const { NotificationModule } = NativeModules;
const notificationEmitter = new NativeEventEmitter(NotificationModule);

interface Notification {
  uniqueKey: string;
  title: string;
  description: string;
  imageUrl?: string;
  pushLink: string;
  pushName: string;
  pushDate: string;
}

const NotificationCenterScreen = ({ navigation }: { navigation: any }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadNotifications();

    const subscription = notificationEmitter.addListener('newNotification', () => {
      loadNotifications();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const result = await NotificationModule.getNotifications();
      const notificationStrings = JSON.parse(result);
      const notificationList = notificationStrings.map((notificationString: string) => {
        const notification = JSON.parse(notificationString);
        /*
        Assuming payload of push notification has this structure:
           {"pushName":"<Push name>",
            "pushDate":"<Push date>"
            }
        */
        if (notification.payload) {
          const payload = JSON.parse(notification.payload);
          notification.pushName = payload.pushName;
          notification.pushDate = payload.pushDate;
        } else {
          notification.pushName = "";
          notification.pushDate = "";
        }
        return notification;
      }).reverse();
      setNotifications(notificationList);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const clearNotifications = async () => {
    try {
      await NotificationModule.clearNotifications();
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const handlePushClick = (pushName: string, pushDate: string) => {
    asyncOperationNCPushOpen(pushName, pushDate);
  };
  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.uniqueKey}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPushClick={() =>
              handlePushClick(item.pushName, item.pushDate)}
          />
        )}
      />
      <View style={styles.buttonContainer}>
        <View style={styles.buttonWrapper}>
          <Button title="Clear Notification" onPress={clearNotifications} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 16,
  },
  buttonWrapper: {
    marginBottom: 10,
  },
});

export default NotificationCenterScreen;
