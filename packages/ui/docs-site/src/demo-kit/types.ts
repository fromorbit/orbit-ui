import type { ComponentType } from 'react'
import type { IconName } from '../../../src'

/** The product a demo belongs to; its satellite colours the preview (`data-product`). */
export type DemoProduct = 'orbit' | 'halo' | 'fold'

/** One state of a demo the block can switch to: an error, an empty list, a second step. */
export interface DemoVariant {
  value: string
  label: string
}

/** What a screen gets from its block: the variant chosen in the block's header, if it has any. */
export interface DemoScreenProps {
  variant?: string
}

/**
 * What one file under `demos/` exports by default: a whole screen and how the page presents it.
 *
 * The slug is the file name, so a link (`#/demo/review`) and the file are found by one word.
 */
export interface DemoModule {
  /** The name of the block. */
  title: string
  /** One sentence under the title: what the screen is and what it shows off. */
  description: string
  /** The glyph in the jump bar. */
  icon: IconName
  /** The product the screen is from; Orbit when left out. */
  product?: DemoProduct
  /** The states the block offers; the first is the one it opens with. */
  variants?: readonly DemoVariant[]
  /** The screen itself, filling its frame like an app window, at any width of that frame. */
  Screen: ComponentType<DemoScreenProps>
}

/** A demo as the page knows it: the module plus its slug. */
export interface Demo extends DemoModule {
  slug: string
}
