/**
 * Why a block could not be shown — the payload of `MindboxEmbeddedBlock`'s `onFail`.
 *
 * Meant for logs and analytics on the host side, not for branching: whatever the reason, the block
 * has already collapsed or switched to its error screen. A string rather than a closed union so a
 * later SDK can add a reason without breaking an exhaustive `switch` — keep a fallback when
 * matching. The raw values are the same on every platform: what the native iOS and Android blocks
 * report under these names reaches React Native unchanged.
 *
 * The constants below are the ones this version knows; a later SDK may report a word that is not
 * among them, and it arrives as it is.
 */
export type MindboxEmbeddedBlockFailReason = 'networkError' | 'internalError' | (string & {})

export const MindboxEmbeddedBlockFailReason = {
  /**
   * The content is unavailable because of the environment: the config could not be downloaded and
   * nothing is cached, the SDK gave no answer within the block's waiting budget, the block's page
   * could not be loaded, or — on iOS — the data the targeting needs could not be fetched. Typically
   * a network problem.
   */
  networkError: 'networkError',

  /**
   * An error on the Mindbox side: the page loaded but never reported its content or reported
   * something unusable, or the SDK failed inside. Also what a platform without a native block
   * reports.
   */
  internalError: 'internalError',
} as const
