import { NativeModules } from 'react-native';

type MindboxSdkType = {
  multiply(a: number, b: number): Promise<number>;
};

const { MindboxSdk } = NativeModules;

export default MindboxSdk as MindboxSdkType;
