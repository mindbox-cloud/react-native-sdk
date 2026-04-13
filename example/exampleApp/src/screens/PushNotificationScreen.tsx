import React from 'react'
import { View, Text, StyleSheet, Button } from 'react-native'
import { useAppNavigation } from '../navigation/AppNavigationContext'

const PushNotificationScreen = () => {
  const navigation = useAppNavigation()
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Opened after click on push</Text>
      <View style={styles.spacing} />
      <Button title="Back to Home" onPress={() => navigation.goBack()} />
    </View>
  )
}

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
  spacing: {
    height: 24,
  },
})

export default PushNotificationScreen
