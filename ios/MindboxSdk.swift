import Mindbox
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
    var subscribeCustomerIfCreated: Bool
    var shouldCreateCustomer: Bool?
    var previousInstallId: String?
    var previousUuid: String?
}

@objc(MindboxSdk)
class MindboxSdk: NSObject, RCTBridgeModule  {

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }

    let compositeDelegate: CompositeInappMessageDelegate? = null

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

    class CustomCallback: InAppMessagesDelegate {

      func inAppMessageTapAction(id: String, url: URL?, payload: String) {
        if let bridge = self.bridge {
            bridge.eventDispatcher().sendAppEvent(withName: "Click", body: ["id": id, "redirectUrl": url, "payload": payload])
          }

      }

      func inAppMessageDismissed(id: String) {
             if let bridge = self.bridge {
             bridge.eventDispatcher().sendAppEvent(withName: "Dismiss", body: ["id": id])
              }
      }

    }

    @objc func registerCallbacks(_ callbacks: [String]) {
       var cb = [InAppCallback]()

       for callback in callbacks {
         switch callback {
         case "urlInAppCallback":
           cb.append(UrlInAppCallback())

         case "copyPayloadInAppCallback":
           cb.append(CopyPayloadInAppCallback())
         case "emptyInAppCallback":
           cb.append(EmptyInAppCallback())

         default:
           cb.append(CustomCallback())
         }
       }
       compositeDelegate = CompositeInappMessageDelegate(cb)
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
}
