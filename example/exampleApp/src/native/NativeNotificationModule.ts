import type { TurboModule } from 'react-native'
import { TurboModuleRegistry } from 'react-native'
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes'

export type NotificationCenterUpdatedEvent = {}

export interface Spec extends TurboModule {
  getNotifications(): Promise<string>
  clearNotifications(): Promise<void>
  readonly onNotificationCenterUpdated: EventEmitter<NotificationCenterUpdatedEvent>
}

export default TurboModuleRegistry.getEnforcing<Spec>('NotificationModule')
