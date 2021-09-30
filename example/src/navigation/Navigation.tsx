import React, { FC } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import { Configuration, Methods } from '../screens';

import type { RootStackParamList } from './NavigationTypes';

const RootStack = createNativeStackNavigator<RootStackParamList>();

const Navigation: FC = () => {
  return (
    <NavigationContainer>
      <RootStack.Navigator initialRouteName="Configuration">
        <RootStack.Screen name="Configuration" component={Configuration} />
        <RootStack.Screen name="Methods" component={Methods} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
