import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { type ShortcutPort, UiProvider } from '../provider/UiProvider'
import { Kbd } from './Kbd'

/** A host's catalogue with one command, whose key differs per platform as Orbit's panel key does. */
function catalogue(platform: 'mac' | 'other'): ShortcutPort {
  return {
    label: (id) =>
      id === 'panel.toggle' ? (platform === 'mac' ? '⌥⌘B' : 'Ctrl+Shift+B') : undefined,
    aria: () => undefined,
  }
}

test('draws one kbd per key: icons for modifiers, the letter as text', () => {
  render(<Kbd platform="mac">⇧⌘R</Kbd>)
  const keys = [...document.querySelectorAll('kbd')]
  expect(keys).toHaveLength(3)
  expect(keys[0]?.querySelector('svg')).not.toBeNull()
  expect(keys[1]?.querySelector('svg')).not.toBeNull()
  expect(keys[2]?.querySelector('svg')).toBeNull()
  expect(keys[2]).toHaveTextContent('R')
})

test('a screen reader hears the keys spelled out, and not the drawing', () => {
  render(
    <button type="button">
      Herladen <Kbd platform="mac">⇧⌘R</Kbd>
    </button>,
  )
  expect(screen.getByRole('button')).toHaveAccessibleName('Herladen Shift Command R')
  expect(document.querySelector('kbd')?.closest('[aria-hidden="true"]')).not.toBeNull()
})

test('follows the platform of the provider when none is given', () => {
  const { unmount } = render(
    <UiProvider platform="mac">
      <Kbd>Meta+Alt+b</Kbd>
    </UiProvider>,
  )
  expect(screen.getByText('Command Option B')).toBeInTheDocument()
  expect(document.querySelectorAll('kbd svg')).toHaveLength(2)
  unmount()
  render(
    <UiProvider platform="linux">
      <Kbd>Ctrl+Shift+B</Kbd>
    </UiProvider>,
  )
  const keys = [...document.querySelectorAll('kbd')]
  expect(keys.map((key) => key.textContent)).toEqual(['Ctrl', '', 'B'])
  expect(screen.getByText('Control Shift B')).toBeInTheDocument()
})

test('a word on a key is set in small capitals, a letter is not', () => {
  const { rerender } = render(<Kbd platform="mac">Escape</Kbd>)
  const key = () => document.querySelector('kbd')
  expect(key()).toHaveTextContent('esc')
  expect(key()?.className).toContain('all-small-caps')
  rerender(<Kbd platform="mac">K</Kbd>)
  expect(key()).toHaveTextContent('K')
  expect(key()?.className).not.toContain('all-small-caps')
})

test('every key has the same height and the icons are extra small', () => {
  render(<Kbd platform="mac">⌥Enter</Kbd>)
  for (const key of document.querySelectorAll('kbd')) {
    expect(key.className).toContain('h-5')
    expect(key.querySelector('svg')?.getAttribute('class')).toContain('size-(--nt-icon-xs)')
  }
})

test('quiet is the default, and strong brings the keys forward', () => {
  // On a filled row muted is 3.40:1, under the 4.5:1 body text owes; see `KbdTone`.
  const { container, rerender } = render(<Kbd platform="mac">⌘K</Kbd>)
  const row = () => container.querySelector('[data-nt-kbd]')?.className ?? ''
  expect(row()).toContain('text-muted')
  rerender(
    <Kbd platform="mac" tone="strong">
      ⌘K
    </Kbd>,
  )
  expect(row()).toContain('text-fg')
  expect(row()).not.toContain('text-muted')
})

test('draws the keys the port gives for a shortcut id, in the convention of the provider', () => {
  const { unmount } = render(
    <UiProvider shortcuts={catalogue('mac')} platform="mac">
      <Kbd shortcut="panel.toggle" />
    </UiProvider>,
  )
  const mac = [...document.querySelectorAll('kbd')]
  expect(mac).toHaveLength(3)
  expect(mac.filter((key) => key.querySelector('svg') !== null)).toHaveLength(2)
  expect(mac[2]).toHaveTextContent('B')
  expect(screen.getByText('Option Command B')).toBeInTheDocument()
  unmount()
  render(
    <UiProvider shortcuts={catalogue('other')} platform="windows">
      <Kbd shortcut="panel.toggle" />
    </UiProvider>,
  )
  const other = [...document.querySelectorAll('kbd')]
  expect(other.map((key) => key.textContent)).toEqual(['Ctrl', '', 'B'])
  expect(screen.getByText('Control Shift B')).toBeInTheDocument()
})

test('draws nothing for an id the port has no key for, or without a provider', () => {
  const { container, unmount } = render(
    <UiProvider shortcuts={catalogue('mac')}>
      <Kbd shortcut="chat.new" />
    </UiProvider>,
  )
  expect(container.querySelector('[data-nt-kbd]')).toBeNull()
  unmount()
  const bare = render(<Kbd shortcut="panel.toggle" />)
  expect(bare.container.querySelector('[data-nt-kbd]')).toBeNull()
})

test.each(['Enter', '↵', '⏎', '↩'])(
  '%s draws the corner-down-left icon and never a glyph',
  (text) => {
    // Nowhere in the interface stands "↵" as text.
    const { container } = render(<Kbd platform="mac">{text}</Kbd>)
    const keys = [...container.querySelectorAll('kbd')]
    expect(keys).toHaveLength(1)
    expect(keys[0]?.querySelector('svg')?.getAttribute('class')).toContain(
      'lucide-corner-down-left',
    )
    expect(container.textContent).not.toMatch(/[↵⏎↩]/)
  },
)

test.each(['⇧↵', '⌘↵', 'Shift+Enter', 'Meta+Enter'])('%s draws two icons', (text) => {
  const { container } = render(<Kbd platform="mac">{text}</Kbd>)
  const keys = [...container.querySelectorAll('kbd')]
  expect(keys).toHaveLength(2)
  for (const key of keys) expect(key.querySelector('svg')).not.toBeNull()
  expect(keys[1]?.querySelector('svg')?.getAttribute('class')).toContain('lucide-corner-down-left')
  expect(container.textContent).not.toMatch(/[↵⏎↩]/)
})

test('keycap sets every key in a cap of its own: 18px, radius 4, a strong border', () => {
  // The hints under the composer.
  const { container } = render(
    <Kbd platform="mac" tone="keycap">
      ⇧↵
    </Kbd>,
  )
  const keys = [...container.querySelectorAll('kbd')]
  expect(keys).toHaveLength(2)
  for (const key of keys) {
    expect(key.className).toContain('h-[18px]')
    expect(key.className).toContain('min-w-[18px]')
    expect(key.className).toContain('rounded-sm')
    expect(key.className).toContain('border-border-strong')
  }
  expect(container.querySelector('[data-nt-kbd]')?.className).toContain('text-secondary')
})

test('on-accent lays the keys on a white plane of 16% in white, for the primary button', () => {
  const { container } = render(
    <Kbd platform="mac" tone="on-accent">
      ⌘↵
    </Kbd>,
  )
  const row = container.querySelector('[data-nt-kbd]')?.className ?? ''
  expect(row).toContain('bg-accent-key')
  expect(row).toContain('text-accent-fg')
  expect(row).not.toContain('text-muted')
  // The keys themselves carry no cap: the plane is the one shape.
  for (const key of container.querySelectorAll('kbd')) expect(key.className).not.toContain('border')
})

test('menu sets the whole shortcut in one cap: 11px, radius 4, a strong border', () => {
  // Design A of the account menu: "⌘," as one key-like label, never two loose keys.
  const { container } = render(
    <Kbd platform="mac" tone="menu">
      ⌘,
    </Kbd>,
  )
  const cap = container.querySelector('[data-nt-kbd]')?.className ?? ''
  expect(cap).toContain('rounded-sm')
  expect(cap).toContain('border-border-strong')
  expect(cap).toContain('text-[11px]')
  const keys = [...container.querySelectorAll('kbd')]
  expect(keys).toHaveLength(2)
  for (const key of keys) expect(key.className).not.toContain('border')
  expect(screen.getByText('Command Comma')).toBeInTheDocument()
})

test('menu-strong is the same one cap, with its letters forward on an active row', () => {
  // ⌘K and every `SearchList` draw the cap of the account menu; on
  // the active fill muted falls under AA, so only the colour of the letters changes.
  const { container } = render(
    <>
      <Kbd platform="mac" tone="menu">
        ⌘,
      </Kbd>
      <Kbd platform="mac" tone="menu-strong">
        ⌘,
      </Kbd>
    </>,
  )
  const [quiet, strong] = [...container.querySelectorAll('[data-nt-kbd]')].map(
    (cap) => cap.className,
  )
  expect(strong).toBe(quiet?.replace('text-muted', 'text-fg'))
})

test('a key has no width of its own, so a comma stands beside its modifier', () => {
  // A box of 16px centred the comma in air of its own: "⌘   ,".
  for (const tone of ['quiet', 'strong', 'menu', 'menu-strong', 'plane'] as const) {
    const { container, unmount } = render(
      <Kbd platform="mac" tone={tone}>
        ⌘,
      </Kbd>,
    )
    for (const key of container.querySelectorAll('kbd')) expect(key.className).not.toMatch(/min-w/)
    unmount()
  }
})

test('names the keys through the keyName of the port, in the host language', () => {
  const port: ShortcutPort = {
    label: () => undefined,
    aria: () => undefined,
    keyName: (key) => ({ command: 'Command', comma: 'Komma' })[key as 'command' | 'comma'] ?? key,
  }
  render(
    <UiProvider shortcuts={port}>
      <Kbd platform="mac">⌘,</Kbd>
    </UiProvider>,
  )
  expect(screen.getByText('Command Komma')).toBeInTheDocument()
})

test('without a keyName a key is read by its code name, not by a word of the library', () => {
  render(<Kbd platform="mac">⇧↑</Kbd>)
  expect(screen.getByText('Shift ArrowUp')).toBeInTheDocument()
})
