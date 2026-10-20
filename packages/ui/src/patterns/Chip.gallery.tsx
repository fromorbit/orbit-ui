import type { Story } from '../gallery/story'
import { TooltipProvider } from '../overlays/Tooltip'
import { Chip, ChipRow } from './Chip'
import { PierreFileIcon } from './PierreFileIcon'

/** A made-up crop: a button on a light page, the kind of thing a pick cuts out. */
const CROP = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="48">
    <rect width="96" height="48" fill="#f4f1ea"/>
    <rect x="12" y="12" width="72" height="24" rx="4" fill="#2f5d50"/>
  </svg>`,
)}`

/** A made-up screenshot: a page with a header and three tiles. */
const PAGE = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="96">
    <rect width="160" height="96" fill="#f4f1ea"/>
    <rect width="160" height="16" fill="#2f5d50"/>
    <rect x="8" y="32" width="44" height="44" rx="3" fill="#d98c5f"/>
    <rect x="58" y="32" width="44" height="44" rx="3" fill="#7aa6c2"/>
    <rect x="108" y="32" width="44" height="44" rx="3" fill="#c9b458"/>
  </svg>`,
)}`

/** A file reference: the type icon of the file, its name, the whole path in the title. */
function WithIcon() {
  return (
    <Chip
      label="totaal.ts"
      title="src/winkelmand/totaal.ts"
      icon={<PierreFileIcon path="src/winkelmand/totaal.ts" />}
      remove={{ label: 'Remove: src/winkelmand/totaal.ts', onRemove: () => {} }}
    />
  )
}

function Plain() {
  return <Chip label="Plain chip" />
}

function WithThumbnail() {
  return (
    <Chip label="button ‘Save’ on shop.test" image={CROP} panel={{ label: 'Crop' }}>
      <img src={CROP} alt="" className="w-48" />
    </Chip>
  )
}

function Removable() {
  return (
    <Chip
      label="Screenshot of shop.test"
      image={PAGE}
      panel={{ label: 'Screenshot' }}
      remove={{ label: 'Remove: Screenshot of shop.test', onRemove: () => {} }}
    >
      <img src={PAGE} alt="" className="w-48" />
    </Chip>
  )
}

function Long() {
  return (
    <Chip
      label="link ‘Read everything about the terms of delivery and returns’ on shop.test"
      image={CROP}
      remove={{ label: 'Remove', onRemove: () => {} }}
    />
  )
}

/** Two annotations of one message and a screenshot between them, which is not counted. */
function Numbered() {
  return (
    // As narrow as the row story, so this state does not widen the column of all the others.
    <div className="w-80">
      <ChipRow label="Attachments">
        <Chip
          key="a"
          label="button ‘Save’ on shop.test"
          image={CROP}
          number={{ value: 1, label: 'Annotation 1 of 2' }}
          panel={{ label: 'Annotation 1 of 2' }}
        >
          <img src={CROP} alt="" className="w-48" />
        </Chip>
        <Chip key="b" label="Screenshot of shop.test" image={PAGE} />
        <Chip
          key="c"
          label="Area on shop.test"
          image={PAGE}
          number={{ value: 2, label: 'Annotation 2 of 2' }}
          remove={{ label: 'Remove: Annotation 2 of 2: Area on shop.test', onRemove: () => {} }}
        />
      </ChipRow>
    </div>
  )
}

/** A pick the user adjusted in the page: the dimmed sliders after its words. */
function Marked() {
  return (
    <TooltipProvider>
      <Chip
        label="button ‘Save’ on shop.test"
        image={CROP}
        number={{ value: 2, label: 'Annotation 2 of 3' }}
        mark={{ icon: 'sliders-horizontal', label: '2 adjustments' }}
        panel={{ label: 'Annotation 2 of 3' }}
        remove={{
          label: 'Remove: Annotation 2 of 3: button ‘Save’ on shop.test',
          onRemove: () => {},
        }}
      >
        <img src={CROP} alt="" className="w-48" />
      </Chip>
    </TooltipProvider>
  )
}

/** Five chips in a column narrower than they are together, so the row has to wrap. */
function Row() {
  return (
    <div className="w-80">
      <ChipRow label="Attachments">
        <Chip key="a" label="button ‘Save’ on shop.test" image={CROP} />
        <Chip key="b" label="Screenshot of shop.test" image={PAGE} />
        <Chip key="c" label="Area on shop.test" image={PAGE} />
        <Chip key="d" label="link ‘Cart’ on shop.test" image={CROP} />
        <Chip key="e" label="heading ‘Shoes’ on shop.test" image={CROP} />
      </ChipRow>
    </div>
  )
}

export default {
  group: 'patterns',
  title: 'Chip',
  states: {
    Plain,
    'With a thumbnail': WithThumbnail,
    'With a cross': Removable,
    'A long name': Long,
    Numbered,
    'With a mark': Marked,
    'A row that wraps': Row,
    'With an icon': WithIcon,
  },
} satisfies Story
