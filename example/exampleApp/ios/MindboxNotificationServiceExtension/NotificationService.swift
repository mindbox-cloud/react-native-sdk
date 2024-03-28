import UserNotifications
import MindboxNotifications

// https://developers.mindbox.ru/docs/ios-send-rich-push-react-native
class NotificationService: UNNotificationServiceExtension {
    
    // Lazy initialization of MindboxNotificationService
    lazy var mindboxService = MindboxNotificationService()

    // Handles the received notification request and modifies the content accordingly.
    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        // Processing the incoming notification
        mindboxService.didReceive(request, withContentHandler: contentHandler)
    }
  
    override func serviceExtensionTimeWillExpire() {
        // Handling expiration of service extension time
        mindboxService.serviceExtensionTimeWillExpire()
    }
}
