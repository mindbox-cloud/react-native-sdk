# mindbox-sdk

SDK for integration React Native mobile apps with Mindbox

## Installation

```sh
npm install mindbox-sdk
```

## Usage

```js
import MindboxSdk from "mindbox-sdk";
```

### Methods

#### initialize (Promise)

Initialization of MindboxSdk. It is recommended to do this on app's launch.

```js
await MindboxSdk.initialize({
  domain: 'api.mindbox.ru',
  endpointId: 'your-endpoint-id-here',
  subscribeCustomerIfCreated: true,
  shouldCreateCustomer: true,
  previousInstallId: '',
  previousUuid: '',
});
```

#### getDeviceUUID

Requires a callback that will return device UUID.

```js
MindboxSdk.getDeviceUUID((uuid) => { ... });
```

#### getToken

Requires a callback that will return FMS (Android) / APNS (iOS) token.

```js
MindboxSdk.getToken((token) => { ... });
```

#### updateToken (Promise)

Updates your FMS/APNS token.

```js
await MindboxSdk.updateToken('your-fms/apns-token');
```

## License

MIT
