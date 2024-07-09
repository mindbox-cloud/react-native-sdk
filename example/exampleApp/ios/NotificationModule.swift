import Foundation
import React

@objc(NotificationModule)
class NotificationModule: RCTEventEmitter {

  static let suiteName = "group.cloud.Mindbox.com.mindbox.exampleRN"
  private var hasListeners = false

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func supportedEvents() -> [String]! {
    return ["newNotification"]
  }

  // send notification data to RN
  @objc func getNotifications(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let userDefaults = UserDefaults(suiteName: "group.cloud.Mindbox.com.mindbox.exampleRN")
    let notificationsJson = userDefaults?.string(forKey: "notifications") ?? "[]"
    resolve(notificationsJson)
  }

  //clear notifications data on native part
  @objc func clearNotifications(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let userDefaults = UserDefaults(suiteName: NotificationModule.suiteName)
    userDefaults?.removeObject(forKey: "notifications")
    userDefaults?.synchronize()
    resolve(nil)
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  // send event about new notification
  func notifyReactNative() {
    if hasListeners {
      sendEvent(withName: "newNotification", body: nil)
    }
  }
}
