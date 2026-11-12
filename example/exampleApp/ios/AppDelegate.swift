import UIKit
import UserNotifications
import Mindbox
import MindboxSdk


// https://developers.mindbox.ru/docs/ios-send-push-notifications-react-native
@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {

        // Set the current instance of UNUserNotificationCenter's delegate to self.
        // This enables the AppDelegate to respond to notification events
        UNUserNotificationCenter.current().delegate = self

        // Register background tasks
        Mindbox.shared.registerBGTasks()

        return true
    }

    func notifyReactNative() {
        NotificationCenter.default.post(name: NotificationModule.newNotification, object: nil)
    }

    // Handling remote notification fetch completion
    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        Mindbox.shared.application(application, performFetchWithCompletionHandler: completionHandler)
        notifyReactNative()
    }

    // Updating APNS token in Mindbox
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Mindbox.shared.apnsTokenUpdate(deviceToken: deviceToken)
    }

    // Displaying notifications when the app is active
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        notifyReactNative()
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
