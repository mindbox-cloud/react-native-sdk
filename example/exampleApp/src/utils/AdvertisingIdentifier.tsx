import { Platform } from 'react-native'
import MindboxSdk from 'mindbox-sdk'
import ReactNativeIdfaAaid from '@sparkfabrik/react-native-idfa-aaid'

// https://developers.mindbox.ru/docs/react-native-sdk-methods
// Called at launch and on every return to the app: the SDK does not read the IDFA itself.
// The library shows the tracking permission request while the user has not answered.
export const passAdvertisingIdentifier = async () => {
  if (Platform.OS !== 'ios') {
    return
  }

  try {
    const { id } = await ReactNativeIdfaAaid.getAdvertisingInfo()
    MindboxSdk.setAdvertisingIdentifier(id)
  } catch {
    MindboxSdk.setAdvertisingIdentifier(null)
  }
}
