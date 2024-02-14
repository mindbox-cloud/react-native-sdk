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

        // https://developers.mindbox.ru/docs/ios-app-start-tracking-react-native
        // Tracking app launch for analytics
        let trackVisitData = TrackVisitData()
        trackVisitData.launchOptions = launchOptions
        Mindbox.shared.track(data: trackVisitData)

        // Register background tasks for iOS 13 and later, or set background fetch interval for earlier versions
        if #available(iOS 13.0, *) {
            Mindbox.shared.registerBGTasks()
        } else {
            UIApplication.shared.setMinimumBackgroundFetchInterval(UIApplication.backgroundFetchIntervalMinimum)
        }

        return true
    }

    // Handling remote notification fetch completion
    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        Mindbox.shared.application(application, performFetchWithCompletionHandler: completionHandler)
    }

    // Updating APNS token in Mindbox
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Mindbox.shared.apnsTokenUpdate(deviceToken: deviceToken)
    }

    // Handling Universal Links
    // https://developers.mindbox.ru/docs/ios-app-start-tracking-react-native
    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        let trackVisitData = TrackVisitData()
        trackVisitData.universalLink = userActivity
        Mindbox.shared.track(data: trackVisitData)
        return true
    }

    // Displaying notifications when the app is active
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.alert, .sound, .badge])
    }

    // Handling push notification clicks
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        // https://developers.mindbox.ru/docs/ios-get-click-react-native
        Mindbox.shared.pushClicked(response: response)
        // https://developers.mindbox.ru/docs/ios-app-start-tracking-react-native
        // Tracking push notification clicks for analytics
        let trackVisitData = TrackVisitData()
        trackVisitData.push = response
        Mindbox.shared.track(data: trackVisitData)

        // Emitting event for further handling in JavaScript
        // https://developers.mindbox.ru/docs/flutter-push-navigation-react-native
        MindboxJsDelivery.emitEvent(response)

        completionHandler()
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
