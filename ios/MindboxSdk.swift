import Mindbox

@objc(MindboxSdk)
class MindboxSdk: NSObject {

    @objc(init:endpoint:)
    func init(_ domain: String, endpoint: String) -> Void {
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
