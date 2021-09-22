import { NativeModules } from 'react-native';

type MindboxSdkType = {
  initialize(domain: String, endpoint: String): void;
};

const { MindboxSdk } = NativeModules;

export default MindboxSdk as MindboxSdkType;
