import { Platform } from 'react-native'

export const MINDBOX_REACT_NATIVE_VERSION = '2.16.0'

const UNKNOWN_VERSION = 'unknown'
const VERSION_FORMAT = /^[A-Za-z0-9._+-]{1,36}$/

type ReactNativeVersion = { major: number; minor: number; patch: number; prerelease?: string | number | null }
type PlatformWithConstants = { constants: { reactNativeVersion?: ReactNativeVersion } }
type ExpoGlobal = { modules?: { ExponentConstants?: { manifest?: unknown } } }

const versionOrUnknown = (read: () => unknown): string => {
  try {
    const version = read()
    return typeof version === 'string' && VERSION_FORMAT.test(version) ? version : UNKNOWN_VERSION
  } catch {
    return UNKNOWN_VERSION
  }
}

const reactNativeVersion = (): string =>
  versionOrUnknown(() => {
    const version = (Platform as unknown as PlatformWithConstants).constants.reactNativeVersion
    if (!version || ![version.major, version.minor, version.patch].every(Number.isInteger)) {
      return undefined
    }
    const release = `${version.major}.${version.minor}.${version.patch}`
    return version.prerelease != null ? `${release}-${version.prerelease}` : release
  })

const expoGlobal = (): ExpoGlobal | undefined => {
  try {
    return (globalThis as { expo?: ExpoGlobal | null }).expo ?? undefined
  } catch {
    return undefined
  }
}

const expoSdkVersion = (expo: ExpoGlobal): string =>
  versionOrUnknown(() => {
    const manifest = expo.modules?.ExponentConstants?.manifest
    const appConfig = typeof manifest === 'string' ? JSON.parse(manifest) : manifest
    return (appConfig as { sdkVersion?: unknown } | null | undefined)?.sdkVersion
  })

export const integrationFramework = (): string => {
  const expo = expoGlobal()
  const parts = [`react-native/${reactNativeVersion()}`]
  if (expo) {
    parts.push(`expo/${expoSdkVersion(expo)}`)
  }
  parts.push(`mindbox-react-native/${MINDBOX_REACT_NATIVE_VERSION}`)
  return parts.join('; ')
}
