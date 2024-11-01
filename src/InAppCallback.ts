export interface InAppCallback {
  getName(): string

  onInAppClick(id: string, redirectUrl: string, payload: string): void

  onInAppDismissed(id: string): void
}

export class UrlInAppCallback implements InAppCallback {
  getName(): string {
    return 'urlInAppCallback'
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

export class CopyPayloadInAppCallback implements InAppCallback {
  getName(): string {
    return 'copyPayloadInAppCallback'
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
    return 'emptyInAppCallback'
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
