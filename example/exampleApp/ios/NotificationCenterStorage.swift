import Foundation

@objc(NotificationCenterStorage)
final class NotificationCenterStorage: NSObject {
    static let suiteName: String = "group.cloud.Mindbox.mindbox.RN.Example"
    static let notificationCenterUpdatedRawName: String = "NotificationCenterUpdated"
    static let notificationCenterUpdatedName: Notification.Name = Notification.Name(notificationCenterUpdatedRawName)
    private static let notificationsKey: String = "notifications"
    private static let emptyNotificationsJson: String = "[]"

    @objc static func getNotificationCenterUpdatedName() -> String {
        return notificationCenterUpdatedRawName
    }

    @objc static func getNotificationsJson() -> String {
        guard let userDefaults: UserDefaults = UserDefaults(suiteName: suiteName) else {
            return emptyNotificationsJson
        }
        return userDefaults.string(forKey: notificationsKey) ?? emptyNotificationsJson
    }

    @objc static func clearNotifications() {
        let userDefaults: UserDefaults? = UserDefaults(suiteName: suiteName)
        userDefaults?.set(emptyNotificationsJson, forKey: notificationsKey)
        userDefaults?.synchronize()
    }

}
