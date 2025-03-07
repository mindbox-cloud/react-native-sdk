import UserNotifications
import MindboxNotifications

// https://developers.mindbox.ru/docs/ios-send-rich-push-react-native
class NotificationService: UNNotificationServiceExtension {

    static let suiteName = "group.cloud.Mindbox.com.mindbox.exampleRN"
    // Lazy initialization of MindboxNotificationService
    lazy var mindboxService = MindboxNotificationService()

    // Handles the received notification request and modifies the content accordingly.
    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        // Processing the incoming notification
        mindboxService.didReceive(request, withContentHandler: contentHandler)
        saveNotification(request: request)
    }

    override func serviceExtensionTimeWillExpire() {
        // Handling expiration of service extension time
        mindboxService.serviceExtensionTimeWillExpire()
    }

    // save data from notification to userDefaults
    // don't use userDefault on your application, it's only for example
    func saveNotification(request: UNNotificationRequest) {
            guard let pushData = mindboxService.getMindboxPushData(userInfo: request.content.userInfo) else {
                print("Failed to get Mindbox push data")
                return
            }

            let mindboxRemoteMessage = MindboxRemoteMessage(
                uniqueKey: pushData.uniqueKey ?? UUID().uuidString,
                title: pushData.aps?.alert?.title ?? "",
                description: pushData.aps?.alert?.body ?? "",
                pushLink: pushData.clickUrl,
                imageUrl: pushData.imageUrl,
                pushActions: pushData.buttons?.map { PushAction(uniqueKey: $0.uniqueKey ?? UUID().uuidString, text: $0.text ?? "", url: $0.url ?? "") } ?? [],
                payload: pushData.payload
            )

            let userDefaults = UserDefaults(suiteName: NotificationService.suiteName)
            let notificationsJson = userDefaults?.string(forKey: "notifications") ?? "[]"

            do {
                var notifications = try JSONDecoder().decode([String].self, from: Data(notificationsJson.utf8))

                let jsonData = try JSONEncoder().encode(mindboxRemoteMessage)
                if let jsonString = String(data: jsonData, encoding: .utf8) {
                    notifications.append(jsonString)
                } else {
                    print("Failed to encode mindboxRemoteMessage to String")
                }

                let updatedNotificationsData = try JSONEncoder().encode(notifications)
                if let updatedNotificationsString = String(data: updatedNotificationsData, encoding: .utf8) {
                    userDefaults?.set(updatedNotificationsString, forKey: "notifications")
                } else {
                    print("Failed to encode updated notifications to String")
                }
            } catch {
                print("Error processing notifications: \(error)")
            }
            userDefaults?.synchronize()
        }
}
