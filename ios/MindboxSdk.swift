import Mindbox

@objc(MindboxSdk)
class MindboxSdk: NSObject {

    @objc(initialize:endpoint:)
    func initialize(_ domain: String, endpoint: String) -> Void {
    do {
      let configuration = try MBConfiguration(
        endpoint: endpoint,
        domain: domain,
        subscribeCustomerIfCreated: true
      )

      Mindbox.shared.initialization(configuration: configuration)
    } catch {
      print(error)
    }
  }
}
