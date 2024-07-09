import Foundation

struct MindboxRemoteMessage: Codable {
    let uniqueKey: String
    let title: String
    let description: String
    let pushLink: String?
    let imageUrl: String?
    let pushActions: [PushAction]
    let payload: String?
}
