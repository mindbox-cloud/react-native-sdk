export type InitializationData = {
  domain: string
  endpointId: string
  subscribeCustomerIfCreated?: boolean
  shouldCreateCustomer?: boolean
  previousInstallId?: string
  previousUuid?: string
  operationsDomain?: string
  /**
   * Android only, ignored on iOS. Specifies whether the app versionCode is included
   * in the app version reported to Mindbox. When false, only versionName is reported.
   * Default value is true.
   */
  shouldIncludeVersionCode?: boolean
  /**
   * Android only, ignored on iOS. Turns off collection of the device tracking identifier
   * (GAID from Google Mobile Services, OAID from Huawei Mobile Services) that the SDK otherwise
   * reports to Mindbox together with the application events. Pass true to stop the collection.
   * This is the only supported way to opt out: removing the AD_ID permission affects the whole app
   * and does not stop OAID collection. The SDK never requests a runtime permission for it, and
   * RuStore provides no tracking identifier. The value is applied on every initialization, so it
   * can be turned on or off in a later app version.
   * Default value is false (the identifier is collected).
   */
  disableTrackingIds?: boolean
}
