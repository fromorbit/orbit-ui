import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

/**
 * A consumer of the build: renders a component from `dist/`, as Orbit does through `@nt/ui`.
 * Needs `bun run build` first, so it runs in `bun run test:consumer`, not in `check`.
 */

const root = resolve(import.meta.dirname, '..')

/** The built root entry, typed by its source; `exports.test.ts` checks the built types exist. */
async function built(): Promise<typeof import('../src/index')> {
  return import(pathToFileURL(join(root, 'dist', 'index.js')).href)
}

describe('the built package', () => {
  test('renders a Button from the built package', async () => {
    const { Button } = await built()
    render(<Button variant="primary">Send</Button>)
    expect(screen.getByRole('button', { name: 'Send' })).toHaveClass('bg-accent')
  })

  test('draws no keys for a shortcut without a UiProvider', async () => {
    const { Button } = await built()
    render(<Button shortcut="chat.send">Send</Button>)
    const button = screen.getByRole('button', { name: 'Send' })
    expect(button).not.toHaveAttribute('aria-keyshortcuts')
    expect(button.querySelector('kbd')).toBeNull()
  })

  test('renders a Button with the keys its UiProvider gives', async () => {
    const { Button, UiProvider } = await built()
    const shortcuts = { label: () => '⌘↵', aria: () => 'Meta+Enter' }
    render(
      <UiProvider shortcuts={shortcuts}>
        <Button shortcut="chat.send">Send</Button>
      </UiProvider>,
    )
    expect(screen.getByRole('button', { name: /Send/ })).toHaveAttribute(
      'aria-keyshortcuts',
      'Meta+Enter',
    )
  })

  test('keeps every class string literal for the consumer Tailwind', () => {
    const code = readFileSync(join(root, 'dist', 'primitives', 'Button.js'), 'utf8')
    expect(code).toContain('"bg-accent text-accent-fg hover:brightness-110')
  })

  test('ships the design tokens', () => {
    expect(readFileSync(join(root, 'dist', 'tokens.css'), 'utf8')).toContain('--nt-accent')
  })

  test('ships the theme: the Tailwind names of the tokens and the classes of the components', () => {
    const theme = readFileSync(join(root, 'dist', 'theme.css'), 'utf8')
    expect(theme).toContain('--color-accent: var(--nt-accent);')
    expect(theme).toMatch(/\.nt-wave\s*\{/)
    expect(theme).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
  })
})
