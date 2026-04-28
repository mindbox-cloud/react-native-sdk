import Foundation
import Mindbox
import MindboxLogger

struct PayloadData: Codable {
    var domain: String
    var endpointId: String
    var subscribeCustomerIfCreated: Bool?
    var shouldCreateCustomer: Bool?
    var previousInstallId: String?
    var previousUuid: String?
}

public typealias ResolveBlock = (Any?) -> Void
public typealias RejectBlock = (String?, String?, NSError?) -> Void
public typealias EventEmitHandler = (_ eventName: String, _ body: [String: String]) -> Void

@objc(MindboxSdkImpl)
public final class MindboxSdkImpl: NSObject {

    private var urlInappDelegate: URLInappMessageDelegate?
    private var copyInappDelegate: CopyInappMessageDelegate?
    private var emptyInappDelegate: InAppMessagesDelegate?
    private var customClass: InAppMessagesDelegate?
    private var compositeDelegate: CompositeInappMessageDelegate?

    @objc var isPushListenerRegistered: Bool = false
    @objc static var pendingPushPayload: [String: String]?
    @objc public var eventEmitHandler: EventEmitHandler?

    private static let stateQueue = DispatchQueue(label: "com.mindboxsdk.MindboxSdkImpl.state")
    private static weak var activeInstance: MindboxSdkImpl?

    @objc public override init() {
        super.init()
        MindboxSdkImpl.stateQueue.sync {
            MindboxSdkImpl.activeInstance = self
        }
    }

    @objc public func initialize(_ payloadString: String, resolve: @escaping ResolveBlock, reject: @escaping RejectBlock) {
        do {
            guard let payloadData = payloadString.data(using: .utf8) else {
                reject("Error", "Initialization payload must be UTF-8 encoded", nil)
                return
            }
            let payload = try JSONDecoder().decode(PayloadData.self, from: payloadData)
            let configuration = try MBConfiguration(
                endpoint: payload.endpointId,
                domain: payload.domain,
                previousInstallationId: payload.previousInstallId,
                previousDeviceUUID: payload.previousUuid,
                subscribeCustomerIfCreated: payload.subscribeCustomerIfCreated ?? false,
                shouldCreateCustomer: payload.shouldCreateCustomer ?? true
            )
            Mindbox.shared.initialization(configuration: configuration)
            resolve(true)
        } catch {
            reject("Error", error.localizedDescription, error as NSError)
        }
    }

    @objc public func getDeviceUUID(_ resolve: @escaping ResolveBlock, reject: @escaping RejectBlock) {
        Mindbox.shared.getDeviceUUID { deviceUUID in
            resolve(deviceUUID)
        }
    }

    @objc public func getTokens(_ resolve: @escaping ResolveBlock, reject: @escaping RejectBlock) {
        Mindbox.shared.getAPNSToken { apnsToken in
            do {
                let tokens: [String: String] = ["APNS": apnsToken]
                let data = try JSONSerialization.data(withJSONObject: tokens)
                guard let json = String(data: data, encoding: .utf8) else {
                    reject("Error", "Failed to encode APNS token payload", nil)
                    return
                }
                resolve(json)
            } catch {
                reject("Error", error.localizedDescription, error as NSError)
            }
        }
    }

    @objc public func registerCallbacks(_ callbacks: [String]) {
        var cb = [InAppMessagesDelegate]()
        for callback in callbacks {
            switch callback {
            case "urlInAppCallback":
                urlInappDelegate = URLInappDelegate()
                if let urlInappDelegate = urlInappDelegate {
                    cb.append(urlInappDelegate)
                }
            case "copyPayloadInAppCallback":
                copyInappDelegate = CopyInappDelegate()
                if let copyInappDelegate = copyInappDelegate {
                    cb.append(copyInappDelegate)
                }
            case "emptyInAppCallback":
                emptyInappDelegate = EmptyInappDelegate()
                if let emptyInappDelegate = emptyInappDelegate {
                    cb.append(emptyInappDelegate)
                }
            default:
                customClass = CustomInappDelegate()
                if let customClass = customClass {
                    cb.append(customClass)
                }
            }
        }
        compositeDelegate = CompositeInappDelegate()
        compositeDelegate?.delegates = cb
        Mindbox.shared.inAppMessagesDelegate = compositeDelegate
    }

    @objc public func executeAsyncOperation(_ operationSystemName: String, operationBody: String, resolve: @escaping ResolveBlock, reject: @escaping RejectBlock) {
        Mindbox.shared.executeAsyncOperation(operationSystemName: operationSystemName, json: operationBody)
        resolve(true)
    }

    @objc public func executeSyncOperation(_ operationSystemName: String, operationBody: String, resolve: @escaping ResolveBlock, reject: @escaping RejectBlock) {
        Mindbox.shared.executeSyncOperation(operationSystemName: operationSystemName, json: operationBody) { result in
            switch result {
            case .success(let response):
                resolve(response.createJSON())
            case .failure(let error):
                resolve(error.createJSON())
            }
        }
    }

    @objc public func onPushClickedIsRegistered(_ isRegistered: Bool) {
        let pendingPayload: [String: String]? = MindboxSdkImpl.stateQueue.sync {
            isPushListenerRegistered = isRegistered
            guard isRegistered, let pendingPayload = MindboxSdkImpl.pendingPushPayload else {
                return nil
            }
            MindboxSdkImpl.pendingPushPayload = nil
            return pendingPayload
        }
        if let pendingPayload = pendingPayload {
            eventEmitHandler?("onPushNotificationClicked", pendingPayload)
        }
    }

    @objc public func setLogLevel(_ level: Double) {
        switch Int(level) {
        case 0: Mindbox.logger.logLevel = .debug
        case 1: Mindbox.logger.logLevel = .info
        case 2: Mindbox.logger.logLevel = .default
        case 3: Mindbox.logger.logLevel = .error
        case 4: Mindbox.logger.logLevel = .fault
        default: Mindbox.logger.logLevel = .none
        }
    }

    @objc public func getSdkVersion(_ resolve: @escaping ResolveBlock, reject: @escaping RejectBlock) {
        resolve(Mindbox.shared.sdkVersion)
    }

    @objc public func pushDelivered(_ uniqKey: String) {
        Mindbox.shared.pushDelivered(uniqueKey: uniqKey)
    }

    @objc public func refreshNotificationPermissionStatus() {
        Mindbox.shared.refreshNotificationPermissionStatus()
    }

    @objc public func writeNativeLog(_ message: String, logLevel: Double) {
        let mappedLogLevel: LogLevel
        switch Int(logLevel) {
        case 0: mappedLogLevel = .debug
        case 1: mappedLogLevel = .info
        case 2: mappedLogLevel = .default
        case 3: mappedLogLevel = .error
        case 4: mappedLogLevel = .fault
        default: mappedLogLevel = .none
        }
        Mindbox.logger.log(level: mappedLogLevel, message: message)
    }

    @objc static func emitPushClick(pushUrl: String, pushPayload: String) {
        let payload: [String: String] = [
            "pushUrl": pushUrl,
            "pushPayload": pushPayload
        ]
        let instance: MindboxSdkImpl? = MindboxSdkImpl.stateQueue.sync {
            guard let activeInstance = MindboxSdkImpl.activeInstance, activeInstance.isPushListenerRegistered else {
                MindboxSdkImpl.pendingPushPayload = payload
                return nil
            }
            return activeInstance
        }
        if let instance = instance {
            instance.eventEmitHandler?("onPushNotificationClicked", payload)
        }
    }

    @objc static func emitInAppClick(id: String, redirectUrl: String?, payload: String?) {
        guard let instance = MindboxSdkImpl.stateQueue.sync(execute: { MindboxSdkImpl.activeInstance }) else { return }
        var body: [String: String] = ["id": id]
        if let redirectUrl = redirectUrl {
            body["redirectUrl"] = redirectUrl
        }
        if let payload = payload {
            body["payload"] = payload
        }
        instance.eventEmitHandler?("onInAppClick", body)
    }

    @objc static func emitInAppDismiss(id: String) {
        guard let instance = MindboxSdkImpl.stateQueue.sync(execute: { MindboxSdkImpl.activeInstance }) else { return }
        instance.eventEmitHandler?("onInAppDismiss", ["id": id])
    }
}
