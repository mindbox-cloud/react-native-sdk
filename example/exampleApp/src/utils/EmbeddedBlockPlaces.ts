// The places the embedded block screens render.
//
// A place is created and named in the Mindbox admin panel; put the names of your places here, the
// same way the domain and the endpoints are set in HomeScreen.tsx. A name the admin panel does not
// know is not a breakage: the place resolves to nothing, the block collapses to zero height and
// reports onFail — the counters on the demo screens show exactly that.
export const embeddedBlockPlaces = {
  /** The block inside the feed. */
  feed: 'placeSystemName',
}

/** The height the host gives each block. The SDK never picks a size on its own. */
export const embeddedBlockHeight = 140

/**
 * TEMPORARY — test mode. While true, the demo screens draw a local HTML banner in the block's place
 * instead of the SDK block, so the layout, the remount counters and the navigation can be tried
 * without a configured place. Set to false — or delete together with LocalTestBanner.tsx — to use
 * the real MindboxEmbeddedBlock.
 */
export const useLocalTestBanner = true
