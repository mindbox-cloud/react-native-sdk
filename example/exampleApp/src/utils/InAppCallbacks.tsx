import MindboxSdk, {
  CopyPayloadInAppCallback,
  EmptyInAppCallback,
  InAppCallback,
  UrlInAppCallback,
} from "mindbox-sdk";

export enum RegisterInappCallback {
  DEFAULT,
  CUSTOM,
  COPY_PAYLOAD,
  EMPTY,
  URL,
}

class TestCallback implements InAppCallback {
  getName(): string {
    return "test";
  }

  onInAppClick(id: string, redirectUrl: string, payload: string): void {
    console.log(`rn inapp click with id = ${id} url = ${redirectUrl} payload = ${payload}`);
  }

  onInAppDismissed(id: string): void {
    console.log(`rn inapp dismiss with id = ${id}`);
  }
}

export const chooseInappCallback = (selectedInappCallback: RegisterInappCallback) => {
  switch (selectedInappCallback) {
    case RegisterInappCallback.DEFAULT:
      // Used default callback
      console.log('used default callback')
      break;
    case RegisterInappCallback.CUSTOM:
      // Custom callback
      console.log('used custom callback')
      MindboxSdk.registerInAppCallbacks([new TestCallback()]);
      break;
    case RegisterInappCallback.COPY_PAYLOAD:
      // Copy payload callback
      console.log('used copy_payload callback')
      MindboxSdk.registerInAppCallbacks([new CopyPayloadInAppCallback()]);
      break;
    case RegisterInappCallback.EMPTY:
      // Empty callback
      console.log('used empty callback')
      MindboxSdk.registerInAppCallbacks([new EmptyInAppCallback()]);
      break;
    case RegisterInappCallback.URL:
      // URL callback
      // console.log('used URL callback')
      MindboxSdk.registerInAppCallbacks([new UrlInAppCallback()]);
      break;
    default:
      // Unknown InAppCallback type, handle error
      console.warn('Unknown InAppCallback type');
  }
};
