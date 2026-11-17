import { NativeModules, Platform } from 'react-native'

import MindboxSdk from '../index'
import { integrationFramework, MINDBOX_REACT_NATIVE_VERSION } from '../integrationFramework'

jest.mock('react-native', () => {
  const actualReactNative = jest.requireActual('react-native')

  actualReactNative.NativeModules.MindboxSdk = {
    initialize: jest.fn(() => Promise.resolve(true)),
    writeNativeLog: jest.fn(),
  }
  actualReactNative.NativeModules.MindboxJsDelivery = {
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  }

  return actualReactNative
})

const wrapperPart = `mindbox-react-native/${MINDBOX_REACT_NATIVE_VERSION}`
const globalWithExpo = globalThis as { expo?: unknown }
const platform = Platform as unknown as { constants: unknown }

const setReactNativeVersion = (reactNativeVersion: unknown) => {
  jest.spyOn(platform, 'constants', 'get').mockReturnValue({ reactNativeVersion })
}

const setExpoManifest = (manifest: unknown) => {
  globalWithExpo.expo = { modules: { ExponentConstants: { manifest } } }
}

describe('integrationFramework', () => {
  beforeEach(() => {
    setReactNativeVersion({ major: 0, minor: 85, patch: 0, prerelease: null })
  })

  afterEach(() => {
    delete globalWithExpo.expo
    jest.restoreAllMocks()
  })

  it('reports React Native and the wrapper in an app without Expo', () => {
    expect(integrationFramework()).toBe(`react-native/0.85.0; ${wrapperPart}`)
  })

  it('keeps the prerelease part of the React Native version', () => {
    setReactNativeVersion({ major: 0, minor: 86, patch: 0, prerelease: 'rc.1' })

    expect(integrationFramework()).toBe(`react-native/0.86.0-rc.1; ${wrapperPart}`)
  })

  it('reports unknown when React Native does not expose its version', () => {
    setReactNativeVersion(undefined)

    expect(integrationFramework()).toBe(`react-native/unknown; ${wrapperPart}`)
  })

  it.each([
    ['has no numbers', {}],
    ['has a part that is not an integer', { major: 0, minor: '85', patch: 0 }],
    ['is longer than 36 characters', { major: 0, minor: 86, patch: 0, prerelease: 'a'.repeat(31) }],
  ])('reports unknown when the React Native version %s', (_, reactNativeVersion) => {
    setReactNativeVersion(reactNativeVersion)

    expect(integrationFramework()).toBe(`react-native/unknown; ${wrapperPart}`)
  })

  it('reports unknown when reading the React Native version throws', () => {
    jest.spyOn(platform, 'constants', 'get').mockImplementation(() => {
      throw new Error('constants are not available')
    })

    expect(integrationFramework()).toBe(`react-native/unknown; ${wrapperPart}`)
  })

  it('adds the Expo SDK version from a manifest object', () => {
    setExpoManifest({ sdkVersion: '55.0.0' })

    expect(integrationFramework()).toBe(`react-native/0.85.0; expo/55.0.0; ${wrapperPart}`)
  })

  it('adds the Expo SDK version from a manifest passed as a JSON string', () => {
    setExpoManifest(JSON.stringify({ sdkVersion: '55.0.0' }))

    expect(integrationFramework()).toBe(`react-native/0.85.0; expo/55.0.0; ${wrapperPart}`)
  })

  it.each([
    ['the manifest is missing', undefined],
    ['the manifest has no sdkVersion', {}],
    ['the manifest is not valid JSON', '{sdkVersion'],
    ['the sdkVersion is not a string', { sdkVersion: 55 }],
    ['the sdkVersion has characters outside the format', { sdkVersion: '55.0.0 beta\n' }],
    ['the sdkVersion is longer than 36 characters', { sdkVersion: '5'.repeat(37) }],
  ])('reports expo/unknown when %s', (_, manifest) => {
    setExpoManifest(manifest)

    expect(integrationFramework()).toBe(`react-native/0.85.0; expo/unknown; ${wrapperPart}`)
  })

  it('reports expo/unknown when Expo modules cannot be read', () => {
    globalWithExpo.expo = {
      get modules(): never {
        throw new Error('modules are not available')
      },
    }

    expect(integrationFramework()).toBe(`react-native/0.85.0; expo/unknown; ${wrapperPart}`)
  })

  it('keeps a nightly React Native version', () => {
    setReactNativeVersion({ major: 0, minor: 86, patch: 12, prerelease: 'nightly-20261117-abcdef123' })

    expect(integrationFramework()).toBe(`react-native/0.86.12-nightly-20261117-abcdef123; ${wrapperPart}`)
  })

  it('stays inside the format the native SDKs accept with the longest versions', () => {
    const longestVersion = `0.86.0-${'a'.repeat(29)}`
    setReactNativeVersion({ major: 0, minor: 86, patch: 0, prerelease: 'a'.repeat(29) })
    setExpoManifest({ sdkVersion: longestVersion })

    const value = integrationFramework()

    expect(value).toBe(`react-native/${longestVersion}; expo/${longestVersion}; ${wrapperPart}`)
    expect(longestVersion).toHaveLength(36)
    expect(value).toMatch(/^[A-Za-z0-9 ._+\-/;]+$/)
    expect(value.length).toBeLessThanOrEqual(128)
  })

  it('carries the wrapper version of the package', () => {
    const packageJson = require('../../package.json')

    expect(MINDBOX_REACT_NATIVE_VERSION).toBe(packageJson['target-version'])
  })
})

describe('initialize', () => {
  const nativeInitialize = NativeModules.MindboxSdk.initialize as jest.Mock

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('passes the integration framework to the native module even when the version cannot be read', async () => {
    jest.spyOn(platform, 'constants', 'get').mockImplementation(() => {
      throw new Error('constants are not available')
    })

    await MindboxSdk.initialize({ domain: 'api.mindbox.ru', endpointId: 'endpoint' })

    const payload = JSON.parse(nativeInitialize.mock.calls[0][0])
    expect(payload).toEqual({
      domain: 'api.mindbox.ru',
      endpointId: 'endpoint',
      integrationFramework: `react-native/unknown; ${wrapperPart}`,
    })
  })
})
