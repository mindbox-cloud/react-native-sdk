import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from './RootStack.types';

export type MethodsNavProps = {
  route: RouteProp<RootStackParamList, 'Methods'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'Methods'>;
};
