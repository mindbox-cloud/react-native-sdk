import { NativeModules } from 'react-native';

type MindboxSdkType = {
  init(domain: String, endpoint: String): void;
};

const { MindboxSdk } = NativeModules;

export default MindboxSdk as MindboxSdkType;
