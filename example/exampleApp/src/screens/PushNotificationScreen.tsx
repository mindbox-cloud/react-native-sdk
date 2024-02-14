import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PushNotificationScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Opened after click on push</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
  },
});

export default PushNotificationScreen;
