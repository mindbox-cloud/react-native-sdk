import type { TurboModule } from 'react-native'
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes'
import { TurboModuleRegistry } from 'react-native'

export interface Spec extends TurboModule {
  initialize(payloadString: string): Promise<boolean>
  registerCallbacks(callbacks: Array<string>): void
  getDeviceUUID(): Promise<string>
  getFMSToken(): Promise<string>
  getTokens(): Promise<string>
  updateFMSToken(token: string): Promise<boolean>
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
    const key: string = String(prop)
    const value: unknown = (m as Record<string, unknown>)[key]
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(m)
    }
    return value
  },
})

export default mindboxTurboModule
