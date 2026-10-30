/** What a block shows while it loads, set when the block is created. */
export type MindboxEmbeddedBlockLoadingStrategy = 'automatic' | 'placeholder' | 'hidden'

export const MindboxEmbeddedBlockLoadingStrategy = {
  /** `placeholder` if the place has shown content on this device and has not come out empty since, otherwise `hidden`. */
  automatic: 'automatic',

  /** A placeholder at the block's height: the host's `placeholder` or the SDK's shimmer. */
  placeholder: 'placeholder',

  /** Zero height until the content is shown. */
  hidden: 'hidden',
} as const
