import * as React from 'react';

import { StyleSheet, View, Text } from 'react-native';
import MindboxSdk from 'mindbox-sdk';

export default function App() {
  React.useEffect(() => {
    MindboxSdk.init('api.mindbox.ru', 'test');
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
