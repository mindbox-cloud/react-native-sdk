/**
 * What the block shows until the SDK has decided what goes into it — given at creation.
 *
 * Every place marked up in the app waits for the SDK on every launch, and a place with no campaign
 * behind it would flash a placeholder and collapse each time. The strategy decides whether the
 * block takes its space before the answer, and the SDK remembers per place whether content was
 * ever shown there: nothing flashes where no content is expected, and where it is expected the
 * space is taken as soon as the native side has read that memory — a frame after the block is
 * mounted, not from the first frame.
 *
 * The same three values exist on every platform; `automatic` is the default everywhere.
 */
export type MindboxEmbeddedBlockLoadingStrategy = 'automatic' | 'placeholder' | 'hidden'

export const MindboxEmbeddedBlockLoadingStrategy = {
  /**
   * Hidden until the place has shown content once on this device; a placeholder from then on.
   *
   * The memory is per place system name and survives a restart. It is dropped when the place
   * answers with nothing to show — the campaign was switched off, the targeting did not match, the
   * page rendered nothing — so the next launch starts hidden again. A failure keeps the memory:
   * that is "could not", not "nothing here".
   *
   * The memory lives on the native side and reaches JS a moment after the block is mounted, so an
   * `automatic` block takes no space until it has: a place that has shown content before gets its
   * placeholder a frame late rather than a place that has not getting a frame of reserved space.
   *
   * At a place that has not shown content yet the block waits hidden, as under `hidden`: no
   * placeholder, and no `error` on a failure — only `onFail` tells.
   */
  automatic: 'automatic',

  /** Always a placeholder until the answer: the SDK shimmer or the host's own `placeholder`. */
  placeholder: 'placeholder',

  /**
   * Hidden until the content is shown once: zero height, no placeholder, and no `error` on a
   * failure — a block that never took its space does not take it for an error screen either. The
   * outcome still arrives through `onFail`. Once content was shown the space is taken, and a later
   * failure may keep it with the host's error screen, like on every platform.
   */
  hidden: 'hidden',
} as const
