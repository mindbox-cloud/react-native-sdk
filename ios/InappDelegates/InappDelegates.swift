import Mindbox

class URLInappDelegate: URLInappMessageDelegate { }

class CopyInappDelegate: CopyInappMessageDelegate { }

class EmptyInappDelegate: InAppMessagesDelegate { }

class CustomInappDelegate: InAppMessagesDelegate {
     func inAppMessageTapAction(id: String, url: URL?, payload: String) {
         MindboxJsDelivery.sendInappEvent("Click", eventId: id, url: url?.absoluteString, payload: payload)
     }

     func inAppMessageDismissed(id: String) {
         MindboxJsDelivery.sendInappEvent("Dismiss", eventId: id, url: nil, payload: nil)
     }
 }

class CompositeInappDelegate: CompositeInappMessageDelegate {
    var delegates: [InAppMessagesDelegate] = []
}
