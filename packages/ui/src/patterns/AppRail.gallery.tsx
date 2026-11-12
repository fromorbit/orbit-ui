import { useState } from 'react'
import type { Story } from '../gallery/story'
import { Dialog } from '../overlays/Dialog'
import { DropdownMenu } from '../overlays/DropdownMenu'
import { Icon, type IconName } from '../primitives/Icon'
import { literalShortcuts, UiProvider } from '../provider/UiProvider'
import { AppRail, AppRailItem } from './AppRail'

/** An app or place on the rail of the story: its words and glyph. */
interface App {
  id: string
  label: string
  icon: IconName
}

/** The apps of the family, from the top. A host gives its own symbols; the story takes glyphs. */
const APPS: readonly App[] = [
  { id: 'start', label: 'Start', icon: 'house' },
  { id: 'lens', label: 'Lens', icon: 'scan-search' },
  { id: 'halo', label: 'Halo', icon: 'layers' },
  { id: 'trail', label: 'Trail', icon: 'camera' },
  { id: 'comet', label: 'Comet', icon: 'sparkles' },
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

/** The keys of the apps in the story, written out: a host names commands of its own catalogue. */
const KEYS: Record<string, string> = {
  start: '⌘1',
  lens: '⌘2',
  halo: '⌘3',
  trail: '⌘4',
  comet: '⌘5',
}

/**
 * The rail as the desktop app lays it: Hulp at the foot is the trigger of a menu (the item hands
 * its ref and props to Radix), and every app names its key in a tooltip beside it.
 */
function MenuShell({ open }: { open: string }) {
  const [current, setCurrent] = useState(open)
  return (
    <UiProvider shortcuts={literalShortcuts}>
      <div className="flex h-[440px] w-fit rounded-lg bg-frame pt-2 text-fg">
        <AppRail
          label="Apps"
          foot={
            <>
              <DropdownMenu
                label="Hulp"
                side="top"
                trigger={<AppRailItem label="Hulp" icon={<Icon name="circle-help" />} />}
                items={[
                  { id: 'keys', label: 'Sneltoetsen', icon: 'keyboard', onSelect: () => {} },
                  { id: 'docs', label: 'Documentatie', icon: 'book-open', onSelect: () => {} },
                ]}
              />
              <AppRailItem
                label="Instellingen"
                icon={<Icon name="settings" />}
                href="#instellingen"
                shortcut="⌘,"
                current={current === 'instellingen'}
                onNavigate={() => setCurrent('instellingen')}
              />
            </>
          }
        >
          {APPS.map((app) => (
            <AppRailItem
              key={app.id}
              label={app.label}
              icon={<Icon name={app.icon} />}
              href={`#${app.id}`}
              current={app.id === current}
              {...(KEYS[app.id] === undefined ? {} : { shortcut: KEYS[app.id] })}
              onNavigate={() => setCurrent(app.id)}
            />
          ))}
        </AppRail>
      </div>
    </UiProvider>
  )
}

/**
 * The rail of the apps on the frame: an app open on its neutral plane, without a dot, a place of the
 * foot open, the narrow rail of icons only, each with its label in a tooltip, and the rail of the
 * desktop app with Hulp as a menu and a key beside every app, in either theme.
 */
export default {
  group: 'patterns',
  title: 'AppRail',
  states: {
    'Lens open': () => <Shell open="lens" />,
    'Instellingen open': () => <Shell open="instellingen" />,
    Smal: () => <Shell open="halo" narrow />,
    'Hulp als menu, sneltoetsen in de tooltip': () => <MenuShell open="lens" />,
    'Op Papier': () => (
      <div data-theme="light" className="w-fit rounded-lg bg-canvas p-4 text-fg shadow-plane">
        <MenuShell open="halo" />
      </div>
    ),
  },
} satisfies Story
