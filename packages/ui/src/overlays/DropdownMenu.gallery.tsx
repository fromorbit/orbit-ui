import type { ReactNode } from 'react'
import type { Story } from '../gallery/story'
import { Avatar } from '../primitives/Avatar'
import { Button } from '../primitives/Button'
import { DropdownMenu, type DropdownMenuItem } from './DropdownMenu'
import { TooltipProvider } from './Tooltip'

// `pencil` is the only icon these rows borrow: `archive` and `trash-2` came into the registry with
// their real user (a row menu of the app), not with this story. The
// third row is the guarded form: `disabled` *and* a `hint` together, the
// combination that keeps a row a real stop of the menu instead of a genuinely disabled one
// (`BrowserMenu`'s own snapshot row at five attachments) — carried by `Open` below rather than a
// story of its own, since a second `defaultOpen` menu on the same page would take the focus and
// close the first one (`Open`'s own JSDoc). Its `aria-describedby` and the `hidden` span it points
// at are what axe's per-story sweep (Orbit's end-to-end gallery test, "no accessibility violations per story")
// reaches this way.
const ROW_ACTIONS: DropdownMenuItem[] = [
  { id: 'rename', label: 'Hernoemen', icon: 'pencil', onSelect: () => {} },
  { id: 'archive', label: 'Archiveren', onSelect: () => {} },
  {
    id: 'delete-guarded',
    label: 'Verwijderen',
    disabled: true,
    hint: 'Nog een chat aan het werk',
    onSelect: () => {},
  },
]

const DANGEROUS_ACTIONS: DropdownMenuItem[] = [
  { id: 'rename', label: 'Hernoemen', icon: 'pencil', onSelect: () => {} },
  { id: 'archive', label: 'Archiveren', onSelect: () => {} },
  { id: 'delete', label: 'Verwijderen', tone: 'danger', onSelect: () => {} },
]

const MANY_BRANCHES: DropdownMenuItem[] = Array.from({ length: 20 }, (_, index) => ({
  id: `branch-${index + 1}`,
  label: `feature/branch-${index + 1}`,
  onSelect: () => {},
}))

// Rows with a `shortcut` label beside an ordinary and a disabled row, so this state can
// carry both without moving `WithADangerousAction`'s screenshot.
const ROW_ACTIONS_WITH_A_SHORTCUT: DropdownMenuItem[] = [
  { id: 'rename', label: 'Hernoemen', icon: 'pencil', shortcut: '⌘R', onSelect: () => {} },
  // Two modifiers and a letter, the row of the feedback that gave `Kbd` its icons.
  { id: 'hard-reload', label: 'Hard herladen', shortcut: '⇧⌘R', onSelect: () => {} },
  { id: 'browser', label: 'Browser', shortcut: 'B', disabled: true, onSelect: () => {} },
]

// Switches rather than actions: every row carries `checked`, so every row keeps the room of a mark.
const VIEW_SWITCHES: DropdownMenuItem[] = [
  { id: 'stacked', label: 'Gestapeld', checked: true, onSelect: () => {} },
  { id: 'split', label: 'Naast elkaar', checked: false, onSelect: () => {} },
  { id: 'wrap', label: 'Regels afbreken', checked: true, onSelect: () => {} },
  { id: 'whitespace', label: 'Witruimte negeren', checked: false, onSelect: () => {} },
]

/**
 * A box tall enough to hold its own open panel; see `Popover.gallery.tsx` for why the height stays
 * with the story rather than the component.
 */
function Stage({ children }: { children: ReactNode }) {
  return <div className="h-64 w-64">{children}</div>
}

/**
 * The plain case: a trigger, and a panel that is not up yet. Wrapped in `TooltipProvider` like
 * `Open`: `ROW_ACTIONS`'s guarded row opens its reason in a `Tooltip`, which throws without one.
 */
function Closed() {
  return (
    <TooltipProvider>
      <DropdownMenu trigger={<Button>Meer</Button>} label="Rijacties" items={ROW_ACTIONS} />
    </TooltipProvider>
  )
}

/**
 * Open from the first render.
 *
 * The one state here that starts open, exactly as `Popover.gallery.tsx` explains: a second panel
 * would take the focus and close this one, so every other state opens on a click instead.
 * `defaultOpen` is the one-way Radix prop for that — see its JSDoc in `DropdownMenu.tsx`. Wrapped
 * in `TooltipProvider` for `ROW_ACTIONS`'s own guarded row, whose reason opens in a `Tooltip`.
 */
function Open() {
  return (
    <Stage>
      <TooltipProvider>
        <DropdownMenu
          trigger={<Button>Meer</Button>}
          label="Rijacties"
          items={ROW_ACTIONS}
          defaultOpen
        />
      </TooltipProvider>
    </Stage>
  )
}

/** The row every archive needs beside the plain ones: styled apart, never overridden per caller. */
function WithADangerousAction() {
  return (
    <DropdownMenu trigger={<Button>Meer</Button>} label="Rijacties" items={DANGEROUS_ACTIONS} />
  )
}

/** More rows than fit: the panel stops at its maximum height and scrolls the rest itself. */
function ALongListScrollsInsideThePanel() {
  return <DropdownMenu trigger={<Button>Branches</Button>} label="Branches" items={MANY_BRANCHES} />
}

/** A row's key label, right-aligned in its `Kbd`; a disabled row carries one just as well. */
function WithAShortcut() {
  return (
    <DropdownMenu
      trigger={<Button>Meer</Button>}
      label="Rijacties"
      items={ROW_ACTIONS_WITH_A_SHORTCUT}
    />
  )
}

const CHOICES: DropdownMenuItem[] = [
  { id: 'rename', label: 'Hernoemen', icon: 'pencil', onSelect: () => {} },
  {
    id: 'compact',
    label: 'Compact',
    kind: 'radio',
    group: 'density',
    checked: true,
    separated: true,
    hint: 'Past meer rijen in beeld',
    onSelect: () => {},
  },
  {
    id: 'roomy',
    label: 'Ruim',
    kind: 'radio',
    group: 'density',
    checked: false,
    onSelect: () => {},
  },
  { id: 'remember', label: 'Onthoud', kind: 'checkbox', checked: true, onSelect: () => {} },
]

/**
 * Settings among the acts: a radio group set apart by a line, with a hint in a tooltip, and a
 * checkbox. The check stands in the place of the icon, in the colour of its row.
 */
function WithChoices() {
  return (
    <TooltipProvider>
      <DropdownMenu trigger={<Button>Weergave</Button>} label="Weergave" items={CHOICES} />
    </TooltipProvider>
  )
}

/** Rows that are on or off, the way the changes tab's `⋯` menu holds its view switches. */
function WithSwitches() {
  return <DropdownMenu trigger={<Button>Weergave</Button>} label="Weergave" items={VIEW_SWITCHES} />
}

/**
 * A head of identity over comfortable rows, as the account menu has it (design A): the avatar, the
 * name and the team on one left line, a line, the rows of 30px and a quiet last row.
 */
function WithAHead() {
  return (
    <DropdownMenu
      trigger={<Button>Robin de Vries</Button>}
      label="Account: Robin de Vries"
      header={{
        title: 'Robin de Vries',
        detail: 'Studio Noord',
        glyph: <Avatar name="Robin de Vries" size="md" />,
      }}
      density="comfortable"
      items={[
        { id: 'account', label: 'Account', icon: 'user', onSelect: () => {} },
        {
          id: 'settings',
          label: 'Instellingen',
          icon: 'settings',
          shortcut: 'settings.toggle',
          onSelect: () => {},
        },
        {
          id: 'out',
          label: 'Afmelden',
          icon: 'log-out',
          tone: 'quiet',
          separated: true,
          onSelect: () => {},
        },
      ]}
    />
  )
}

export default {
  group: 'overlays',
  title: 'DropdownMenu',
  states: {
    Closed,
    Open,
    'With a dangerous action': WithADangerousAction,
    'A long list scrolls inside the panel': ALongListScrollsInsideThePanel,
    'With a shortcut': WithAShortcut,
    'With choices': WithChoices,
    'With switches': WithSwitches,
    'With a head': WithAHead,
  },
} satisfies Story
