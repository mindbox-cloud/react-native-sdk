import Foundation
import UserNotifications

@objc(MindboxJsDeliveryBridge)
public final class MindboxJsDeliveryBridge: NSObject {

    @objc public static func emit(_ response: UNNotificationResponse) {
        MindboxJsDelivery.emitEvent(response)
    }
}
