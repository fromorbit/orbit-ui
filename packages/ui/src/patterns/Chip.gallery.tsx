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
      remove={{ label: 'Verwijder: src/winkelmand/totaal.ts', onRemove: () => {} }}
    />
  )
}

function Plain() {
  return <Chip label="Gewone chip" />
}

function WithThumbnail() {
  return (
    <Chip label="knop ‘Opslaan’ op winkel.test" image={CROP} panel={{ label: 'Uitsnede' }}>
      <img src={CROP} alt="" className="w-48" />
    </Chip>
  )
}

function Removable() {
  return (
    <Chip
      label="Schermafbeelding van winkel.test"
      image={PAGE}
      panel={{ label: 'Schermafbeelding' }}
      remove={{ label: 'Verwijder: Schermafbeelding van winkel.test', onRemove: () => {} }}
    >
      <img src={PAGE} alt="" className="w-48" />
    </Chip>
  )
}

function Long() {
  return (
    <Chip
      label="link ‘Lees alles over de leverings- en retourvoorwaarden’ op winkel.test"
      image={CROP}
      remove={{ label: 'Verwijder', onRemove: () => {} }}
    />
  )
}

/** Two annotations of one message and a screenshot between them, which is not counted. */
function Numbered() {
  return (
    // As narrow as the row story, so this state does not widen the column of all the others.
    <div className="w-full max-w-80">
      <ChipRow label="Bijlagen">
        <Chip
          key="a"
          label="knop ‘Opslaan’ op winkel.test"
          image={CROP}
          number={{ value: 1, label: 'Aantekening 1 van 2' }}
          panel={{ label: 'Aantekening 1 van 2' }}
        >
          <img src={CROP} alt="" className="w-48" />
        </Chip>
        <Chip key="b" label="Schermafbeelding van winkel.test" image={PAGE} />
        <Chip
          key="c"
          label="Gebied op winkel.test"
          image={PAGE}
          number={{ value: 2, label: 'Aantekening 2 van 2' }}
          remove={{
            label: 'Verwijder: Aantekening 2 van 2: Gebied op winkel.test',
            onRemove: () => {},
          }}
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
        label="knop ‘Opslaan’ op winkel.test"
        image={CROP}
        number={{ value: 2, label: 'Aantekening 2 van 3' }}
        mark={{ icon: 'sliders-horizontal', label: '2 aanpassingen' }}
        panel={{ label: 'Aantekening 2 van 3' }}
        remove={{
          label: 'Verwijder: Aantekening 2 van 3: knop ‘Opslaan’ op winkel.test',
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
    <div className="w-full max-w-80">
      <ChipRow label="Bijlagen">
        <Chip key="a" label="knop ‘Opslaan’ op winkel.test" image={CROP} />
        <Chip key="b" label="Schermafbeelding van winkel.test" image={PAGE} />
        <Chip key="c" label="Gebied op winkel.test" image={PAGE} />
        <Chip key="d" label="link ‘Winkelmand’ op winkel.test" image={CROP} />
        <Chip key="e" label="kop ‘Schoenen’ op winkel.test" image={CROP} />
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
