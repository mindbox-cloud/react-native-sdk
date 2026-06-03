import UIKit
import React
import React_RCTAppDelegate
import UserNotifications
import Mindbox
import MindboxSdk

// https://developers.mindbox.ru/docs/ios-send-push-notifications-react-native
@main
class AppDelegate: RCTAppDelegate, UNUserNotificationCenterDelegate {

    override func application(_ application: UIApplication,
                              didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        moduleName = "exampleApp"
        initialProps = [:]
        UNUserNotificationCenter.current().delegate = self
        MindboxApp.configure(launchOptions: launchOptions)
        return super.application(application, didFinishLaunchingWithOptions: launchOptions)
    }

    func notifyReactNativeAboutNotificationCenterUpdate() {
        NotificationCenter.default.post(name: NotificationCenterStorage.notificationCenterUpdatedName, object: nil)
    }

    override func application(_ application: UIApplication,
                              didReceiveRemoteNotification userInfo: [AnyHashable : Any],
                              fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        notifyReactNativeAboutNotificationCenterUpdate()
        Mindbox.shared.application(application, performFetchWithCompletionHandler: completionHandler)
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        notifyReactNativeAboutNotificationCenterUpdate()
        completionHandler([.alert, .sound, .badge])
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        notifyReactNativeAboutNotificationCenterUpdate()
        completionHandler()
    }

    override func sourceURL(for bridge: RCTBridge!) -> URL! {
        bundleURL()
    }

    override func bundleURL() -> URL? {
        #if DEBUG
            RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
        #else
            Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }
}
