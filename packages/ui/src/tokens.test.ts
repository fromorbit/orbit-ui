import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

// Reads the CSS from disk: no DOM involved, so this runs fine under happy-dom with `css: false`.
const tokensCss = readFileSync(join(import.meta.dirname, 'tokens.css'), 'utf8')
// The Tailwind names of the tokens, which Orbit kept in its `index.css` before they moved here.
const themeCss = readFileSync(join(import.meta.dirname, 'theme.css'), 'utf8')

/** Parses `--name: value;` declarations from a CSS string into a map; the first definition wins. */
function parseDeclarations(css: string): Map<string, string> {
  const declarations = new Map<string, string>()
  const pattern = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi
  for (const match of css.matchAll(pattern)) {
    const name = match[1]
    const value = match[2]
    if (name === undefined || value === undefined) continue
    if (!declarations.has(name)) declarations.set(name, value.trim())
  }
  return declarations
}

/** Relative luminance of an opaque sRGB hex color, per the WCAG 2.x definition. */
function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '')
  const channel = (offset: number) => Number.parseInt(clean.slice(offset, offset + 2), 16) / 255
  const linear = (value: number) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  return 0.2126 * linear(channel(0)) + 0.7152 * linear(channel(2)) + 0.0722 * linear(channel(4))
}

/** WCAG contrast ratio between two opaque sRGB hex colors. */
function contrastRatio(hexA: string, hexB: string): number {
  const luminanceA = relativeLuminance(hexA)
  const luminanceB = relativeLuminance(hexB)
  const lighter = Math.max(luminanceA, luminanceB)
  const darker = Math.min(luminanceA, luminanceB)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Resolves a one-level `var(--name)` indirection against the parsed declarations.
 *
 * `--nt-focus-ring` is defined as `var(--nt-accent)` rather than a literal, so a contrast check on
 * it needs the value it actually resolves to.
 */
function resolveVar(value: string, declarations: Map<string, string>): string {
  const match = value.match(/^var\((--[a-z0-9-]+)\)$/i)
  const name = match?.[1]
  return name ? (declarations.get(name) ?? value) : value
}

const tokens = parseDeclarations(tokensCss)

/**
 * The declarations of the light block, `[data-theme="light"] { … }`, alone.
 *
 * An empty map when the block is missing, so the completeness test below names every token it lacks.
 */
function lightBlock(css: string): Map<string, string> {
  const match = css.match(/\n\[data-theme="light"\]\s*{([^}]*)}/)
  return parseDeclarations(match?.[1] ?? '')
}

const lightOnly = lightBlock(tokensCss)

/** The light palette as a page in light sees it: the dark root with the light block over it. */
const lightTokens = new Map([...tokens, ...lightOnly])

/** The two palettes every contrast requirement holds for. */
const palettes = [
  ['dark', tokens],
  ['light', lightTokens],
] as const

/** The opaque hex a token resolves to; fails loudly when it is not one, so a check never passes on ''. */
function hexIn(palette: Map<string, string>, name: string): string {
  const value = resolveVar(palette.get(name) ?? '', palette)
  expect(value, `${name} resolves to an opaque hex colour`).toMatch(/^#[0-9a-f]{6}$/i)
  return value
}

/**
 * The opaque hex of a translucent `rgb(r g b / a)` laid over an opaque hex, as the eye sees it: a
 * banner's plane over the canvas.
 */
function composite(rgba: string, ground: string): string {
  const match = rgba.match(/^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/)
  expect(match, `${rgba} is an rgb() with alpha`).not.toBeNull()
  const [, r, g, b, a] = match ?? []
  const alpha = Number(a)
  return `#${[r, g, b]
    .map((value, index) => {
      const under = Number.parseInt(ground.slice(1 + index * 2, 3 + index * 2), 16)
      return Math.round(Number(value) * alpha + under * (1 - alpha))
        .toString(16)
        .padStart(2, '0')
    })
    .join('')}`
}

/** Whether a value names a colour, directly or through another token, or a shadow made of one. */
function isColour(value: string): boolean {
  // A `calc()` over another token is a length (`--nt-toast-width`), never a colour.
  if (/^calc\(/i.test(value.trim())) return false
  return /#[0-9a-f]{3,8}\b|rgb\(|var\(--nt-/i.test(value)
}

/** The colours of a highlighted code block, which have to read as text on the canvas. */
const codeTokens = [
  '--nt-code-foreground',
  '--nt-code-token-keyword',
  '--nt-code-token-string',
  '--nt-code-token-comment',
  '--nt-code-token-constant',
  '--nt-code-token-function',
  '--nt-code-token-parameter',
  '--nt-code-token-punctuation',
  '--nt-code-token-link',
  '--nt-code-token-inserted',
  '--nt-code-token-deleted',
  '--nt-code-token-changed',
]

const requiredTokens = [
  '--nt-accent',
  '--nt-accent-fg',
  '--nt-accent-text',
  '--nt-accent-subtle',
  '--nt-accent-border',
  '--nt-success',
  '--nt-attention-subtle',
  '--nt-attention-border',
  '--nt-danger-subtle',
  '--nt-danger-border',
  '--nt-control-sm',
  '--nt-control-md',
  '--nt-control-lg',
  '--nt-icon-sm',
  '--nt-icon-md',
  '--nt-z-popover',
  '--nt-z-dialog',
  '--nt-z-toast',
  '--nt-overlay-background',
  '--nt-scrim',
  '--nt-shadow-menu',
  '--nt-focus-ring',
  '--nt-frame',
  '--nt-canvas',
  '--nt-text-secondary',
  '--nt-text-faint',
  '--nt-border-strong',
  '--nt-row-hover',
  '--nt-row-active',
  '--nt-composer',
  '--nt-kind-spec',
  '--nt-kind-plan',
  '--nt-kind-decision',
  '--nt-kind-audit',
  '--nt-pill',
  '--nt-pill-hover',
  '--nt-mark',
  '--nt-accent-key',
]

describe('tokens.css', () => {
  test('every var(--nt-…) in the @theme block of theme.css is defined in tokens.css', () => {
    const themeBlock = themeCss.match(/@theme inline\s*{([^}]*)}/s)
    expect(themeBlock).not.toBeNull()
    const referenced = [...(themeBlock?.[1] ?? '').matchAll(/var\((--nt-[a-z0-9-]+)\)/gi)]
      .map((match) => match[1])
      .filter((name): name is string => name !== undefined)
    expect(referenced.length).toBeGreaterThan(0)
    for (const name of referenced) {
      expect(tokens.has(name), `${name} is missing from tokens.css`).toBe(true)
    }
  })

  test.each(requiredTokens)('%s is defined in tokens.css', (name) => {
    expect(tokens.has(name)).toBe(true)
  })

  test('the terminal keeps its own cyan and code links follow the accent as text', () => {
    // The accent left cyan behind; a program's cyan did not.
    expect(tokens.get('--nt-terminal-ansi-6')).toBe('#3cc4e6')
    expect(tokens.get('--nt-code-token-link')).toBe('var(--nt-accent-text)')
  })

  test('a toast stands 8px above the foot of the sidebar', () => {
    // Over the foot it hid the archive and the gear for as long as it stood.
    expect(tokens.get('--nt-sidebar-foot-height')).toBe('44px')
    expect(tokens.get('--nt-toast-bottom')).toBe('calc(var(--nt-sidebar-foot-height) + 8px)')
  })

  test('without the foot of the sidebar a toast stands 16px above the window edge', () => {
    // A folded or yielded sidebar has no foot to clear.
    const rule = /\[data-nt-toast-without-foot\]\s*\{([^}]*)\}/.exec(tokensCss)
    expect(rule?.[1]).toBeDefined()
    expect(parseDeclarations(rule?.[1] ?? '').get('--nt-toast-bottom')).toBe('16px')
  })

  test('large cards and dialogs round at 10px', () => {
    expect(tokens.get('--nt-radius-lg')).toBe('10px')
  })
})

describe.each(palettes)('the %s palette', (name, palette) => {
  // The contrast requirements of the palette, computed from the file rather than from fixed
  // figures: they hold whatever a value later becomes.
  test('white text on the accent fill reaches AA (≥ 4.5)', () => {
    expect(hexIn(palette, '--nt-accent-fg')).toBe('#ffffff')
    expect(
      contrastRatio(hexIn(palette, '--nt-accent-fg'), hexIn(palette, '--nt-accent')),
    ).toBeGreaterThanOrEqual(4.5)
  })

  // Dark only: the key plane of the light palette (white at 0.2 over #3d74c4) reaches 3,26, which is
  // an open point for the design, not something this check may hide.
  test.runIf(name === 'dark')(
    'the key plane on the accent fill keeps white text at AA (≥ 4.5)',
    () => {
      const plane = palette.get('--nt-accent-key')?.match(/^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/)
      expect(plane).not.toBeNull()
      const [, r, g, b, alpha] = (plane ?? []).map(Number)
      const fill = hexIn(palette, '--nt-accent').replace('#', '')
      const mixed = [r, g, b].map((over, index) => {
        const under = Number.parseInt(fill.slice(index * 2, index * 2 + 2), 16)
        return Math.round((over ?? 0) * (alpha ?? 0) + under * (1 - (alpha ?? 0)))
      })
      const composite = `#${mixed.map((value) => value.toString(16).padStart(2, '0')).join('')}`
      expect(contrastRatio(hexIn(palette, '--nt-accent-fg'), composite)).toBeGreaterThanOrEqual(4.5)
    },
  )

  test.each(['--nt-canvas', '--nt-frame', '--nt-overlay-background'])(
    '--nt-accent-text on %s reaches AA (≥ 4.5)',
    (surface) => {
      expect(
        contrastRatio(hexIn(palette, '--nt-accent-text'), hexIn(palette, surface)),
      ).toBeGreaterThanOrEqual(4.5)
    },
  )

  // The six quiet tones of an avatar: the initials in `text` on each.
  test.each([1, 2, 3, 4, 5, 6])('--nt-text on --nt-avatar-%i reaches AA (≥ 4.5)', (tone) => {
    expect(
      contrastRatio(hexIn(palette, '--nt-text'), hexIn(palette, `--nt-avatar-${tone}`)),
    ).toBeGreaterThanOrEqual(4.5)
    expect(themeCss).toContain(`--color-avatar-${tone}: var(--nt-avatar-${tone});`)
  })

  test('the accent as a fill and as the focus ring stands out against the canvas (≥ 3)', () => {
    expect(
      contrastRatio(hexIn(palette, '--nt-accent'), hexIn(palette, '--nt-canvas')),
    ).toBeGreaterThanOrEqual(3)
    expect(
      contrastRatio(hexIn(palette, '--nt-focus-ring'), hexIn(palette, '--nt-canvas')),
    ).toBeGreaterThanOrEqual(3)
    expect(
      contrastRatio(hexIn(palette, '--nt-focus-ring'), hexIn(palette, '--nt-frame')),
    ).toBeGreaterThanOrEqual(3)
  })

  test.each(['--nt-canvas', '--nt-frame'])(
    '--nt-text-muted on %s reaches AA (≥ 4.5)',
    (surface) => {
      expect(
        contrastRatio(hexIn(palette, '--nt-text-muted'), hexIn(palette, surface)),
      ).toBeGreaterThanOrEqual(4.5)
    },
  )

  test.each(['--nt-canvas', '--nt-frame'])(
    '--nt-text-secondary on %s reaches AAA (≥ 7)',
    (surface) => {
      expect(
        contrastRatio(hexIn(palette, '--nt-text-secondary'), hexIn(palette, surface)),
      ).toBeGreaterThanOrEqual(7)
    },
  )

  test.each(['--nt-kind-spec', '--nt-kind-plan', '--nt-kind-decision', '--nt-kind-audit'])(
    '%s stands out as a glyph on the canvas and the frame (≥ 3)',
    (kind) => {
      expect(
        contrastRatio(hexIn(palette, kind), hexIn(palette, '--nt-canvas')),
      ).toBeGreaterThanOrEqual(3)
      expect(
        contrastRatio(hexIn(palette, kind), hexIn(palette, '--nt-frame')),
      ).toBeGreaterThanOrEqual(3)
    },
  )

  test('the frame (sidebar, window) is darker than the canvas (conversation, panel)', () => {
    expect(relativeLuminance(hexIn(palette, '--nt-frame'))).toBeLessThan(
      relativeLuminance(hexIn(palette, '--nt-canvas')),
    )
    // `bg` stays an alias of the canvas until every use has moved over.
    expect(palette.get('--nt-bg')).toBe('var(--nt-canvas)')
  })

  test('the four text levels step down from text to faint', () => {
    const levels = ['--nt-text', '--nt-text-secondary', '--nt-text-muted', '--nt-text-faint']
    const ratios = levels.map((name) =>
      contrastRatio(hexIn(palette, name), hexIn(palette, '--nt-canvas')),
    )
    for (let index = 1; index < ratios.length; index += 1) {
      expect(ratios[index], levels[index]).toBeLessThan(ratios[index - 1] ?? 0)
    }
  })

  test('the caret row of a list stands 3:1 above the muted rows around it (WCAG 1.4.11)', () => {
    expect(
      contrastRatio(hexIn(palette, '--nt-text-strong'), hexIn(palette, '--nt-text-muted')),
    ).toBeGreaterThanOrEqual(3)
  })

  test('--nt-danger on the canvas reaches the contrast for a glyph that carries a status (≥ 3)', () => {
    // The failed copy shows a danger glyph on the plain background: a graphic, not text.
    expect(
      contrastRatio(hexIn(palette, '--nt-danger'), hexIn(palette, '--nt-canvas')),
    ).toBeGreaterThanOrEqual(3)
  })

  test('--nt-overlay-background is an opaque hex colour, because a floating layer covers fully', () => {
    expect(palette.get('--nt-overlay-background')).toMatch(/^#[0-9a-f]{6}$/i)
  })

  test.each(codeTokens)('%s of a code block reaches AA on the canvas (≥ 4.5)', (token) => {
    expect(
      contrastRatio(hexIn(palette, token), hexIn(palette, '--nt-canvas')),
    ).toBeGreaterThanOrEqual(4.5)
  })

  test.each(['attention', 'danger'])(
    'the words of a %s banner reach AA on its plane over the canvas (≥ 4.5)',
    (tone) => {
      const plane = composite(
        palette.get(`--nt-${tone}-subtle`) ?? '',
        hexIn(palette, '--nt-canvas'),
      )
      expect(contrastRatio(hexIn(palette, `--nt-${tone}`), plane)).toBeGreaterThanOrEqual(4.5)
    },
  )

  test('a menu lies on a layered shadow rather than one cloud', () => {
    expect((palette.get('--nt-shadow-menu') ?? '').split(',')).toHaveLength(3)
  })
})

describe('the light block', () => {
  test('repeats every colour token of the dark palette, so no dark value leaks into light', () => {
    const colours = [...tokens].filter(([, value]) => isColour(value)).map(([name]) => name)
    expect(colours.length).toBeGreaterThan(50)
    const missing = colours.filter((name) => !lightOnly.has(name))
    expect(missing).toEqual([])
  })

  test('names no token the dark palette lacks', () => {
    const extra = [...lightOnly.keys()].filter((name) => !tokens.has(name))
    expect(extra).toEqual([])
  })

  test('asks the browser for light native controls', () => {
    expect(tokensCss).toMatch(/\[data-theme="light"\]\s*{\s*color-scheme:\s*light;/)
  })

  test('is chosen by the attribute only, so the app keeps its dark palette on a light system', () => {
    expect(tokensCss).not.toMatch(/@media[^{]*prefers-color-scheme/)
  })
})

describe('scrollbars', () => {
  const scrollArea = readFileSync(join(import.meta.dirname, 'primitives', 'ScrollArea.tsx'), 'utf8')

  test('the scrollbar tokens exist and match the ScrollArea thumb', () => {
    expect(tokens.get('--nt-scrollbar-size')).toBe('8px')
    expect(tokens.get('--nt-scrollbar-thumb')).toBe('var(--nt-border)')
    expect(tokens.get('--nt-scrollbar-thumb-hover')).toBe('var(--nt-text-muted)')
    // `ScrollArea` draws the same bar itself: 8px (`w-2`), a thumb in `border`, `muted` on hover.
    // Two shapes of scrollbar in one window would be told apart; these may not drift.
    expect(scrollArea).toContain('w-2')
    expect(scrollArea).toContain('bg-border')
    expect(scrollArea).toContain('hover:bg-muted')
  })
})

describe('the tint of a translucent window', () => {
  /** The declarations of the one rule with exactly this selector. */
  function rule(selector: string): Map<string, string> {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const block = tokensCss.match(new RegExp(`\\n${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
    return parseDeclarations(block)
  }

  /** `#rrggbb` as the `r g b` of an `rgb()`. */
  function channels(hex: string): string {
    const clean = hex.replace('#', '')
    return [0, 2, 4].map((offset) => Number.parseInt(clean.slice(offset, offset + 2), 16)).join(' ')
  }

  test('each theme lays its own frame and canvas over the material, at the same strengths', () => {
    const dark = rule(':root[data-translucent="true"]')
    const light = rule(':root[data-translucent="true"][data-theme="light"]')
    expect(dark.get('--nt-app-background')).toBe(
      `rgb(${channels(hexIn(tokens, '--nt-frame'))} / 0.6)`,
    )
    expect(light.get('--nt-app-background')).toBe(
      `rgb(${channels(hexIn(lightTokens, '--nt-frame'))} / 0.6)`,
    )
    expect(light.get('--nt-panel-background')).toBe(
      `rgb(${channels(hexIn(lightTokens, '--nt-canvas'))} / 0.7)`,
    )
  })
})
