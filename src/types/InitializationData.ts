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
}
