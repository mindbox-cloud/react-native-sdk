import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UIKit
import Mindbox

class SceneDelegate: RCTDefaultReactNativeFactoryDelegate, UIWindowSceneDelegate {
    var window: UIWindow?
    var reactNativeFactory: RCTReactNativeFactory?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = scene as? UIWindowScene else {
            return
        }

        // https://developers.mindbox.ru/docs/ios-app-start-tracking-react-native
        // Tracking app launch for analytics
        Mindbox.shared.track(.launchScene(connectionOptions))

        dependencyProvider = RCTAppDependencyProvider()
        reactNativeFactory = RCTReactNativeFactory(delegate: self)
        window = UIWindow(windowScene: windowScene)

        #if DEBUG
        let devMenuConfiguration = RCTDevMenuConfiguration(
            devMenuEnabled: true,
            shakeGestureEnabled: true,
            keyboardShortcutsEnabled: true
        )
        reactNativeFactory?.devMenuConfiguration = devMenuConfiguration
        #endif

        reactNativeFactory?.startReactNative(
            withModuleName: "exampleApp",
            in: window,
            connectionOptions: connectionOptions
        )
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        RCTLinkingManager.scene(scene, openURLContexts: URLContexts)
    }

    // Handling Universal Links
    // https://developers.mindbox.ru/docs/ios-app-start-tracking-react-native
    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        Mindbox.shared.track(.universalLink(userActivity))
        RCTLinkingManager.scene(scene, continue: userActivity)
    }

    override func bundleURL() -> URL? {
        #if DEBUG
        RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
        #else
        Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }
}
