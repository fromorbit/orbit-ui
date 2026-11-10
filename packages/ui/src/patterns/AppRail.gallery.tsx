import { useState } from 'react'
import type { Story } from '../gallery/story'
import { Dialog } from '../overlays/Dialog'
import { Icon, type IconName } from '../primitives/Icon'
import { AppRail, AppRailItem, type FamilyProduct } from './AppRail'

/** An app or place on the rail of the story: its words, glyph and product. */
interface App {
  id: string
  label: string
  icon: IconName
  product?: FamilyProduct
}

/** The apps of the family, from the top. A host gives its own symbols; the story takes glyphs. */
const APPS: readonly App[] = [
  { id: 'start', label: 'Start', icon: 'house' },
  { id: 'lens', label: 'Lens', icon: 'scan-search', product: 'lens' },
  { id: 'halo', label: 'Halo', icon: 'layers', product: 'halo' },
  { id: 'trail', label: 'Trail', icon: 'camera', product: 'trail' },
  { id: 'comet', label: 'Comet', icon: 'sparkles', product: 'comet' },
]

/**
 * The rail on the frame, as the shell lays it: a click opens another app without a reload, Hulp
 * at the foot is a button that opens a dialog, and the last app the pointer or the focus rested on
 * is what a host would prefetch.
 */
function Shell({ open, narrow = false }: { open: string; narrow?: boolean }) {
  const [current, setCurrent] = useState(open)
  const [help, setHelp] = useState(false)
  const item = (app: App) => (
    <AppRailItem
      key={app.id}
      label={app.label}
      icon={<Icon name={app.icon} />}
      href={`#${app.id}`}
      current={app.id === current}
      {...(app.product === undefined ? {} : { product: app.product })}
      onNavigate={() => setCurrent(app.id)}
    />
  )
  return (
    <div className="flex h-[440px] w-fit rounded-lg bg-frame pt-2">
      <AppRail
        label="Apps"
        narrow={narrow}
        foot={
          <>
            <AppRailItem
              label="Hulp"
              icon={<Icon name="circle-help" />}
              onSelect={() => setHelp(true)}
              aria-haspopup="dialog"
            />
            {item({ id: 'instellingen', label: 'Instellingen', icon: 'settings' })}
          </>
        }
      >
        {APPS.map(item)}
      </AppRail>
      <Dialog open={help} onOpenChange={setHelp} title="Hulp" closeLabel="Sluiten">
        <p className="m-0 text-[13px] text-secondary">
          Elke app van Zilverberg staat links op de rail.
        </p>
      </Dialog>
    </div>
  )
}

/**
 * The rail of the apps on the frame: an app open with its satellite beside it, a place of the
 * foot open, and the narrow rail of icons only, each with its label in a tooltip.
 */
export default {
  group: 'patterns',
  title: 'AppRail',
  states: {
    'Lens open': () => <Shell open="lens" />,
    'Instellingen open': () => <Shell open="instellingen" />,
    Smal: () => <Shell open="halo" narrow />,
  },
} satisfies Story
