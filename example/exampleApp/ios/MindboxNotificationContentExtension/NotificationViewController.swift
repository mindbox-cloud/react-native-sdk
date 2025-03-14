import UIKit
import UserNotifications
import UserNotificationsUI
import MindboxNotifications

class NotificationViewController: UIViewController, UNNotificationContentExtension {

    // Lazy initialization of MindboxNotificationService to handle notification content.
    lazy var mindboxService = MindboxNotificationService()

    // This method is called when the notification is delivered to the notification content extension.
    func didReceive(_ notification: UNNotification) {
        // Using MindboxService to process the received notification and display custom content.
        mindboxService.didReceive(notification: notification, viewController: self, extensionContext: extensionContext)
    }
}
