import * as React from 'react';

import { StyleSheet, View, Text, Platform } from 'react-native';
import MindboxSdk from 'mindbox-sdk';

export default function App() {
  React.useEffect(() => {
    switch (Platform.OS) {
      case 'android':
        MindboxSdk.initialize('api.mindbox.ru', 'mpush-test-Android');
        break;
      case 'ios':
        MindboxSdk.initialize('api.mindbox.ru', 'app-with-hub-iOS');
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text>Hello!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
