const path = require('path')
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */

// The SDK comes from this repository (`"mindbox-sdk": "file:../.."`), and that folder carries its own
// node_modules with its own React and React Native. Left alone, Metro would bundle both copies and the
// app would fall over on start — "Invalid hook call", or a TurboModule that cannot be found. Two rules
// keep it to one copy: the repository is watched, so its sources can be bundled at all, and whatever
// the SDK asks for in `react` or `react-native` is answered from this app's node_modules, no matter
// which folder the request came from. An app that installs the package from npm needs none of this.
const sdkRoot = path.resolve(__dirname, '../..')
const sharedModules = ['react', 'react-native']

const config = {
  watchFolders: [sdkRoot],
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      const shared = sharedModules.some((name) => moduleName === name || moduleName.startsWith(`${name}/`))
      const origin = shared ? { ...context, originModulePath: path.join(__dirname, 'index.js') } : context
      return context.resolveRequest(origin, moduleName, platform)
    },
  },
}

module.exports = mergeConfig(getDefaultConfig(__dirname), config)
