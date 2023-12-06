interface InAppCallback {

  getName(): String

  onInAppClick(id: String, redirectUrl: String, payload: String): void

  onInAppDismissed(id: String): void

}
class UrlInAppCallback implements InAppCallback {
  getName(): String {
    return "urlInAppCallback"
  }
  // @ts-ignore
  onInAppClick(id: String, redirectUrl: String, payload: String): void {
    return
  }
  // @ts-ignore
  onInAppDismissed(id: String): void {
    return
  }
}

class CopyPayloadInAppCallback implements InAppCallback {
  getName(): String {
    return "copyPayloadInAppCallback"
  }
  // @ts-ignore
  onInAppClick(id: String, redirectUrl: String, payload: String): void {
    return
  }
  // @ts-ignore
  onInAppDismissed(id: String): void {
    return
  }
}

class EmptyInAppCallback implements InAppCallback {
  getName(): String {
    return "emptyInAppCallback"
  }
  // @ts-ignore
  onInAppClick(id: String, redirectUrl: String, payload: String): void {
    return
  }
  // @ts-ignore
  onInAppDismissed(id: String): void {
    return
  }
}
