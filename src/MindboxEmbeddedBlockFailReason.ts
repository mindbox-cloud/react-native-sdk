/** Why a block failed, for logs and analytics. Later SDK versions may add reasons, so keep a fallback when matching. */
export type MindboxEmbeddedBlockFailReason = 'networkError' | 'internalError' | (string & {})

export const MindboxEmbeddedBlockFailReason = {
  /** The SDK could not get the content: no network or config, no answer within `timeoutMs`, or the page did not load. */
  networkError: 'networkError',

  /** The page did not report usable content or the SDK failed inside; also reported off iOS and Android. */
  internalError: 'internalError',
} as const
