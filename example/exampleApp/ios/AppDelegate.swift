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
        // Set the current instance of UNUserNotificationCenter's delegate to self.
        // This enables the AppDelegate to respond to notification events
        UNUserNotificationCenter.current().delegate = self
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
        return super.application(application, didFinishLaunchingWithOptions: launchOptions)
    }

    func notifyReactNativeAboutNotificationCenterUpdate() {
        NotificationCenter.default.post(name: NotificationCenterStorage.notificationCenterUpdatedName, object: nil)
    }

    // Handling remote notification fetch completion
    override func application(_ application: UIApplication,
                              didReceiveRemoteNotification userInfo: [AnyHashable : Any],
                              fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        Mindbox.shared.application(application, performFetchWithCompletionHandler: completionHandler)
        notifyReactNativeAboutNotificationCenterUpdate()
    }

    // Updating APNS token in Mindbox
    override func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Mindbox.shared.apnsTokenUpdate(deviceToken: deviceToken)
    }

    // Handling Universal Links
    // https://developers.mindbox.ru/docs/ios-app-start-tracking-react-native
    override func application(_ application: UIApplication,
                              continue userActivity: NSUserActivity,
                              restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        let trackVisitData = TrackVisitData()
        trackVisitData.universalLink = userActivity
        Mindbox.shared.track(data: trackVisitData)
        return true
    }

    // Displaying notifications when the app is active
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        notifyReactNativeAboutNotificationCenterUpdate()
        completionHandler([.alert, .sound, .badge])
    }

    // Handling push notification clicks
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        Mindbox.shared.pushClicked(response: response)
        let trackVisitData = TrackVisitData()
        trackVisitData.push = response
        Mindbox.shared.track(data: trackVisitData)
        MindboxJsDelivery.emitEvent(response)
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
