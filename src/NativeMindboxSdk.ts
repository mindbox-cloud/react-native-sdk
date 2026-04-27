import type { TurboModule } from 'react-native'
import { TurboModuleRegistry } from 'react-native'

type EventSubscriptionLike = {
  remove(): void
}

type EventEmitter<T> = (handler: (event: T) => void | Promise<void>) => EventSubscriptionLike

export interface Spec extends TurboModule {
  initialize(payloadString: string): Promise<boolean>
  registerCallbacks(callbacks: Array<string>): void
  getDeviceUUID(): Promise<string>
  getTokens(): Promise<string>
  executeAsyncOperation(operationSystemName: string, operationBody: string): Promise<boolean>
  executeSyncOperation(operationSystemName: string, operationBody: string): Promise<string>
  onPushClickedIsRegistered(isRegistered: boolean): void
  setLogLevel(level: number): void
  getSdkVersion(): Promise<string>
  pushDelivered(uniqKey: string): void
  refreshNotificationPermissionStatus(): void
  writeNativeLog(message: string, logLevel: number): void

  readonly onPushNotificationClicked: EventEmitter<{ pushUrl: string; pushPayload: string }>
  readonly onInAppClick: EventEmitter<{ id: string; redirectUrl: string; payload: string }>
  readonly onInAppDismiss: EventEmitter<{ id: string }>
}

/**
 * Lazy resolve: `getEnforcing` at import time can run before the native runtime has
 * registered Turbo modules (`[runtime not ready]` / invariant in bridgeless).
 */
let mindboxTurboImpl: Spec | null = null

function resolveMindboxTurbo(): Spec {
  if (mindboxTurboImpl == null) {
    mindboxTurboImpl = TurboModuleRegistry.getEnforcing<Spec>('MindboxSdk')
  }
  return mindboxTurboImpl
}

const mindboxTurboModule: Spec = new Proxy({} as Spec, {
  get(_target, prop: string | symbol) {
    const m: Spec = resolveMindboxTurbo()
    const value: unknown = Reflect.get(m as object, prop)
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(m)
    }
    return value
  },
})

export default mindboxTurboModule
