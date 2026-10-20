import { render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, test } from 'vitest'
import { Button } from '../primitives/Button'
import { literalShortcuts, type ShortcutPort, UiProvider, useUi, useUiTheme } from './UiProvider'

/** A host's catalogue of one command, as a port. */
const catalogue: ShortcutPort = {
  label: (id) => (id === 'chat.send' ? '⌘↵' : undefined),
  aria: (id) => (id === 'chat.send' ? 'Meta+Enter' : undefined),
}

describe('UiProvider', () => {
  test('Button without a provider renders no keys and no aria-keyshortcuts', () => {
    render(<Button shortcut="chat.send">Verstuur</Button>)
    const button = screen.getByRole('button', { name: 'Verstuur' })
    expect(button.querySelector('[data-nt-kbd]')).toBeNull()
    expect(button).not.toHaveAttribute('aria-keyshortcuts')
  })

  test('Button inside a provider shows the keys and the aria-keyshortcuts of its port', () => {
    render(
      <UiProvider shortcuts={catalogue}>
        <Button shortcut="chat.send">Verstuur</Button>
      </UiProvider>,
    )
    const button = screen.getByRole('button', { name: 'Verstuur' })
    expect(button.querySelector('[data-nt-kbd]')).not.toBeNull()
    expect(button.querySelectorAll('kbd')).toHaveLength(2)
    expect(button).toHaveAttribute('aria-keyshortcuts', 'Meta+Enter')
  })

  test('draws the keys in the convention of its platform', () => {
    render(
      <UiProvider shortcuts={literalShortcuts} platform="windows">
        <Button shortcut="⌥K">Ga</Button>
      </UiProvider>,
    )
    // Off macOS the sign of Option is the word on the key: Alt.
    expect(screen.getByRole('button', { name: 'Ga' }).textContent).toContain('Alt')
  })

  test('is neutral without a provider: no keys, the Mac platform, the theme of the document', () => {
    const { result } = renderHook(() => ({ ui: useUi(), theme: useUiTheme() }))
    expect(result.current.ui.shortcuts.label('chat.send')).toBeUndefined()
    expect(result.current.ui.shortcuts.aria('chat.send')).toBeUndefined()
    expect(result.current.ui.platform).toBe('mac')
    expect(result.current.theme).toBe('dark')
  })

  test('a nested provider overrides what it names and keeps the rest of the one around it', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <UiProvider shortcuts={catalogue} platform="linux" theme="light">
        <UiProvider platform="mac">{children}</UiProvider>
      </UiProvider>
    )
    const { result } = renderHook(() => ({ ui: useUi(), theme: useUiTheme() }), { wrapper })
    expect(result.current.ui.platform).toBe('mac')
    expect(result.current.ui.shortcuts).toBe(catalogue)
    expect(result.current.theme).toBe('light')
  })

  test('literalShortcuts draws a written-out key as itself and announces nothing', () => {
    expect(literalShortcuts.label('⇧⌘R')).toBe('⇧⌘R')
    expect(literalShortcuts.aria('⇧⌘R')).toBeUndefined()
  })
})
