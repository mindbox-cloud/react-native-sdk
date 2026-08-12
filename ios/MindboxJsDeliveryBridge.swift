import Foundation
import UserNotifications
#if canImport(MindboxSdkObjC)
import MindboxSdkObjC
#endif

@objc(MindboxJsDeliveryBridge)
public final class MindboxJsDeliveryBridge: NSObject {

    @objc public static func emit(_ response: UNNotificationResponse) {
        MindboxJsDelivery.emitEvent(response)
    }
}
