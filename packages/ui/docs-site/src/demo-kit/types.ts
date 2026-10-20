import type { ComponentType } from 'react'
import type { IconName } from '../../../src'

/**
 * What one file under `demos/` exports by default: a whole screen and how the list names it.
 *
 * The slug is the file name, so a link (`#/demo/betalingen`) and the file are found by one word.
 */
export interface DemoModule {
  /** The name in the list and on the stage. */
  title: string
  /** The glyph in the list. */
  icon: IconName
  /** The screen itself, filling the stage like an app window. */
  Screen: ComponentType
}

/** A demo as the page knows it: the module plus its slug. */
export interface Demo extends DemoModule {
  slug: string
}
