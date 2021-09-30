import Mindbox

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
    var subscribeCustomerIfCreated: Bool
    var shouldCreateCustomer: Bool?
    var previousInstallId: String?
    var previousUuid: String?
}

@objc(MindboxSdk)
class MindboxSdk: NSObject {
    
    @objc(initialize:resolve:rejecter:)
    func initialize(_ payloadString: String, resolve: @escaping RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
        do {
            let payload = try JSONDecoder().decode(PayloadData.self, from: payloadString.data(using: .utf8)!)
            
            let configuration = try MBConfiguration(
                endpoint: payload.endpointId,
                domain: payload.domain,
                previousInstallationId: payload.previousInstallId,
                previousDeviceUUID: payload.previousUuid,
                subscribeCustomerIfCreated: payload.subscribeCustomerIfCreated,
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
}
