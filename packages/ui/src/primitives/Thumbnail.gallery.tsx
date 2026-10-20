import type { Story } from '../gallery/story'
import { Thumbnail } from './Thumbnail'

/** A PNG of one pixel: an image without a screen of a real machine in it. */
const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

export default {
  group: 'primitives',
  title: 'Thumbnail',
  states: {
    'With an image, and while it loads': () => (
      <div className="flex items-center gap-3 p-2">
        <Thumbnail label="Image of A1" src={PIXEL} />
        <Thumbnail label="Image of A2" src={null} />
      </div>
    ),
  },
} satisfies Story
