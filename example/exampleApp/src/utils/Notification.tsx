import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
export interface Notification {
  uniqueKey: string
  title: string
  description: string
  imageUrl?: string
  pushLink: string
  pushName: string
  pushDate: string
}

export function isMindboxMessage(remoteMessage: FirebaseMessagingTypes.RemoteMessage): boolean {
  const data = remoteMessage?.data ?? {}
  return typeof (data as any).uniqueKey === 'string' && (data as any).uniqueKey.length > 0
}
