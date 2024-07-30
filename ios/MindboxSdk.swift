import Mindbox
import MindboxLogger
import CoreFoundation

enum CustomError: Error {
    case tokenAPNSisNull
}

extension CustomError: LocalizedError {
    public var errorDescription: String? {
        switch self {
        case .tokenAPNSisNull:
            return NSLocalizedString("APNS token cannot be nullable", comment: "APNS token is null")
        }
    }
}

struct PayloadData: Codable {
    var domain: String
    var endpointId: String
    var subscribeCustomerIfCreated: Bool?
    var shouldCreateCustomer: Bool?
    var previousInstallId: String?
    var previousUuid: String?
}

@objc(MindboxSdk)
class MindboxSdk: NSObject {

    private var urlInappDelegate: URLInappMessageDelegate?
    private var copyInappDelegate: CopyInappMessageDelegate?
    private var emptyInappDelegate: InAppMessagesDelegate?
    private var customClass: InAppMessagesDelegate?
    private var compositeDelegate: CompositeInappMessageDelegate?

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }

    @objc(initialize:resolve:rejecter:)
    func initialize(_ payloadString: String, resolve: @escaping RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
        do {
            let payload = try JSONDecoder().decode(PayloadData.self, from: payloadString.data(using: .utf8)!)

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
            reject("Error", error.localizedDescription, error)
        }
    }

    @objc(getDeviceUUID:rejecter:)
    func getDeviceUUID(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
        Mindbox.shared.getDeviceUUID{
            deviceUUID in resolve(deviceUUID)
        }
    }

    @objc(getAPNSToken:rejecter:)
    func getAPNSToken(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
        Mindbox.shared.getAPNSToken{
            ApnsToken in resolve(ApnsToken)
        }
    }

    @objc func registerCallbacks(_ callbacks: [String]) {
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

    @objc(updateAPNSToken:resolve:rejecter:)
    func updateAPNSToken(_ token: String, resolve: @escaping RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
        do {
            guard let tokenData = token.data(using: .utf8) else { throw CustomError.tokenAPNSisNull }

            Mindbox.shared.apnsTokenUpdate(deviceToken: tokenData)

            resolve(true)
        } catch {
            reject("Error", error.localizedDescription, error)
        }
    }

    @objc(executeAsyncOperation:operationBody:resolve:rejecter:)
    func executeAsyncOperation(_ operationSystemName: String, operationBody: String, resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping  RCTPromiseRejectBlock) -> Void {
        Mindbox.shared.executeAsyncOperation(operationSystemName: operationSystemName, json: operationBody)
        resolve(true)
    }

    @objc(executeSyncOperation:operationBody:resolve:rejecter:)
    func executeSyncOperation(_ operationSystemName: String, operationBody: String, resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping  RCTPromiseRejectBlock) -> Void {
        Mindbox.shared.executeSyncOperation(operationSystemName: operationSystemName, json: operationBody) { result in
            switch result {
            case .success(let response):
                resolve(response.createJSON())
            case .failure(let error):
                resolve(error.createJSON())
            }
        }
    }

    @objc
    static func moduleName() -> String {
        return "MindboxSdk"
    }

    @objc
    func constantsToExport() -> [AnyHashable: Any] {
        return [:]
    }

    @objc(setLogLevel:)
    func setLogLevel(_ level: Int) -> Void {
        switch (level) {
        case 0:
            Mindbox.logger.logLevel = .debug
        case 1:
            Mindbox.logger.logLevel = .info
        case 2:
            Mindbox.logger.logLevel = .default
        case 3:
            Mindbox.logger.logLevel = .error
        case 4:
            Mindbox.logger.logLevel = .fault
        default:
            Mindbox.logger.logLevel = .none
        }
    }

    @objc
    func getSdkVersion() -> String {
        return Mindbox.shared.sdkVersion
    }

    @objc(getSdkVersion:rejecter:)
    func getSdkVersion(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
        do {
            resolve(Mindbox.shared.sdkVersion)
        } catch {
            reject("Error", error.localizedDescription, error)
        }
    }

    @objc(pushDelivered:)
    func pushDelivered(_ uniqKey: String) {
        Mindbox.shared.pushDelivered(uniqueKey: uniqKey)
    }

    @objc
    func updateNotificationPermissionStatus(_ granted: Bool) {
        Mindbox.shared.notificationsRequestAuthorization(granted: granted)
    }

    @objc
    func writeNativeLog(_ message: String, level: Int) {
        
        let logLevel: LogLevel
        
        switch level {
        case 0:
            logLevel = .debug
        case 1:
            logLevel = .info
        case 2:
            logLevel = .default
        case 3:
            logLevel = .error
        case 4:
            logLevel = .fault
        default:
            logLevel = .none
        }
        Mindbox.logger.log(level: logLevel, message: message)
    }
}
