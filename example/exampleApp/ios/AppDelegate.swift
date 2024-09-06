import UIKit
import React
import UserNotifications
import Mindbox
import MindboxSdk


// https://developers.mindbox.ru/docs/ios-send-push-notifications-react-native
@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?
    var bridge: RCTBridge!

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        // Set the current instance of UNUserNotificationCenter's delegate to self.
        // This enables the AppDelegate to respond to notification events
        UNUserNotificationCenter.current().delegate = self

        // Setting up React Native bridge
        bridge = RCTBridge(delegate: self, launchOptions: launchOptions)
        let rootView = RCTRootView(bridge: bridge, moduleName: "exampleApp", initialProperties: nil)

        // Configuring the application window
        self.window = UIWindow(frame: UIScreen.main.bounds)
        let rootViewController = UIViewController()
        rootViewController.view = rootView
        self.window!.rootViewController = rootViewController
        self.window!.makeKeyAndVisible()

        return true
    }
}

extension AppDelegate: RCTBridgeDelegate {
    func sourceURL(for bridge: RCTBridge!) -> URL! {
        #if DEBUG
            return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index", fallbackResource: nil)
        #else
            return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }
}
