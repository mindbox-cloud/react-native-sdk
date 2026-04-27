import Foundation
import UserNotifications

@objc(MindboxJsDelivery)
public final class MindboxJsDelivery: NSObject {

    @objc public static func emitEvent(_ response: UNNotificationResponse) {
        let userInfo = response.notification.request.content.userInfo
        let actionIdentifier = response.actionIdentifier
        let pushUrl = resolvePushUrl(userInfo: userInfo, actionIdentifier: actionIdentifier)
        let pushPayload = resolvePushPayload(userInfo: userInfo)
        MindboxSdkImpl.emitPushClick(pushUrl: pushUrl, pushPayload: pushPayload)
    }

    @objc public static func sendInappEvent(_ eventName: String, eventId: String, url: String?, payload: String?) {
        switch eventName {
        case "Click":
            MindboxSdkImpl.emitInAppClick(id: eventId, redirectUrl: url, payload: payload)
        case "Dismiss":
            MindboxSdkImpl.emitInAppDismiss(id: eventId)
        default:
            break
        }
    }

    private static func resolvePushUrl(userInfo: [AnyHashable: Any], actionIdentifier: String) -> String {
        if actionIdentifier == UNNotificationDefaultActionIdentifier {
            return readString(userInfo: userInfo, key: "clickUrl")
                ?? readString(userInfo: readDictionary(userInfo: userInfo, key: "aps"), key: "clickUrl")
                ?? ""
        }
        let buttonUrl = readButtonUrl(userInfo: userInfo, uniqueKey: actionIdentifier)
        if let buttonUrl = buttonUrl, !buttonUrl.isEmpty {
            return buttonUrl
        }
        let aps = readDictionary(userInfo: userInfo, key: "aps")
        return readButtonUrl(userInfo: aps, uniqueKey: actionIdentifier) ?? ""
    }

    private static func resolvePushPayload(userInfo: [AnyHashable: Any]) -> String {
        return readString(userInfo: userInfo, key: "payload")
            ?? readString(userInfo: readDictionary(userInfo: userInfo, key: "aps"), key: "payload")
            ?? ""
    }

    private static func readButtonUrl(userInfo: [AnyHashable: Any], uniqueKey: String) -> String? {
        guard let buttons = userInfo["buttons"] as? [[String: Any]] else {
            return nil
        }
        return buttons.first(where: { ($0["uniqueKey"] as? String) == uniqueKey })?["url"] as? String
    }

    private static func readDictionary(userInfo: [AnyHashable: Any], key: String) -> [AnyHashable: Any] {
        guard let dictionary = userInfo[key] as? [AnyHashable: Any] else {
            return [:]
        }
        return dictionary
    }

    private static func readString(userInfo: [AnyHashable: Any], key: String) -> String? {
        return userInfo[key] as? String
    }
}
