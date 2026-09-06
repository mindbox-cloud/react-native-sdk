// The places the embedded block screens render.
//
// A place is created and named in the Mindbox admin panel; put the names of your places here, the
// same way the domain and the endpoints are set in HomeScreen.tsx. A name the admin panel does not
// know is not a breakage: the place resolves to nothing, the block collapses to zero height and
// reports onFail — the counters on the demo screens show exactly that.
export const embeddedBlockPlaces = {
  /** The block at the top of the screen, in the header slot of the list. */
  top: 'main-screen-top',
  /** The block at the bottom of the screen, in the footer slot of the list. */
  bottom: 'main-screen-bottom',
}

/** The height the host gives each block. The SDK never picks a size on its own. */
export const embeddedBlockHeight = 120
