export interface InAppCallback {

  getName(): String

  onInAppClick(id: String, redirectUrl: String, payload: String): void

  onInAppDismissed(id: String): void

}
export class UrlInAppCallback implements InAppCallback {
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

export class CopyPayloadInAppCallback implements InAppCallback {
  getName(): string {
    return "copyPayloadInAppCallback"
  }
  // @ts-ignore
  onInAppClick(id: string, redirectUrl: string, payload: string): void {
    return
  }
  // @ts-ignore
  onInAppDismissed(id: string): void {
    return
  }
}

export class EmptyInAppCallback implements InAppCallback {
  getName(): string {
    return "emptyInAppCallback"
  }
  // @ts-ignore
  onInAppClick(id: string, redirectUrl: string, payload: string): void {
    return
  }
  // @ts-ignore
  onInAppDismissed(id: string): void {
    return
  }
}

