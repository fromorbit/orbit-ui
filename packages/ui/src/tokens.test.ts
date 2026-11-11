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
 * Resolves `var(--name)` indirections against the parsed declarations, through every level.
 *
 * A role names a fixed colour of the family (`--nt-text: var(--nt-brand-paper)`) and an alias names
 * a role (`--nt-code-foreground: var(--nt-text)`), so a contrast check needs the value at the end of
 * the chain. Stops after a few steps, so a cycle fails the hex check instead of hanging.
 */
function resolveVar(value: string, declarations: Map<string, string>): string {
  let current = value
  for (let step = 0; step < 5; step += 1) {
    const name = current.match(/^var\((--[a-z0-9-]+)\)$/i)?.[1]
    const next = name ? declarations.get(name) : undefined
    if (next === undefined) return current
    current = next
  }
  return current
}

const tokens = parseDeclarations(tokensCss)

/**
 * The fixed colours of the family and the product's satellite: the same in both themes, so the
 * light block must not repeat them (a `data-theme` inside a `data-product` would reset the
 * satellite to Orbit's).
 */
function isConstant(name: string): boolean {
  return name.startsWith('--nt-brand-') || name === '--nt-satellite'
}

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
  '--nt-side-panel',
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
  '--nt-satellite',
  '--nt-brand-midnight',
  '--nt-brand-paper',
  '--nt-brand-violet',
  '--nt-brand-orbit',
  '--nt-brand-halo',
  '--nt-brand-fold',
  '--nt-brand-lens',
  '--nt-brand-trail',
  '--nt-brand-comet',
  '--nt-font-weight-heading',
  '--nt-sidebar-gradient',
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

  test('the radii nest: a card of 12px holds rows of 8px at a 4px inset, marks of 4px', () => {
    expect(tokens.get('--nt-radius-lg')).toBe('12px')
    expect(tokens.get('--nt-radius-md')).toBe('8px')
    expect(tokens.get('--nt-radius-sm')).toBe('4px')
  })

  test('the control heights stand on the 4px grid, the default one a 32px target', () => {
    const heights = ['xs', 'sm', 'md', 'lg'].map((size) => tokens.get(`--nt-control-${size}`))
    expect(heights).toEqual(['24px', '28px', '32px', '40px'])
  })

  test('motion stays under the Doherty threshold: fast for hover, calm for what opens', () => {
    expect(tokens.get('--nt-duration-fast')).toBe('120ms')
    expect(tokens.get('--nt-duration')).toBe('180ms')
  })

  test('the space between groups is three times the space inside one (Proximity)', () => {
    const px = (name: string) => Number.parseInt(tokens.get(name) ?? '', 10)
    expect(px('--nt-space-group')).toBeGreaterThanOrEqual(3 * px('--nt-space-item'))
    expect(px('--nt-space-section')).toBeGreaterThan(px('--nt-space-group'))
  })
})

describe.each(palettes)('the %s palette', (theme, palette) => {
  // The contrast requirements of the palette, computed from the file rather than from fixed
  // figures: they hold whatever a value later becomes.
  test('the words on the accent fill reach AA (≥ 4.5)', () => {
    expect(
      contrastRatio(hexIn(palette, '--nt-accent-fg'), hexIn(palette, '--nt-accent')),
    ).toBeGreaterThanOrEqual(4.5)
  })

  test('the main button is monochrome: Paper and Midnight, never the satellite', () => {
    const fill = hexIn(palette, '--nt-accent')
    const words = hexIn(palette, '--nt-accent-fg')
    expect([fill, words].sort()).toEqual(['#111936', '#f5f4f0'])
  })

  test.each(['--nt-canvas', '--nt-frame', '--nt-overlay-background', '--nt-composer'])(
    '--nt-text on %s reaches AA (≥ 4.5)',
    (surface) => {
      expect(
        contrastRatio(hexIn(palette, '--nt-text'), hexIn(palette, surface)),
      ).toBeGreaterThanOrEqual(4.5)
    },
  )

  test('--nt-text-secondary, the meta of a lit row, reaches AA on it, on the canvas, the side panel, the frame and a card', () => {
    // Muted stays 3:1 under the caret row's words, so a lit row lifts its meta to secondary; the
    // open row of `SideNav` lies on the side panel, the open item of `AppRail` on the frame.
    for (const ground of [
      '--nt-canvas',
      '--nt-side-panel',
      '--nt-frame',
      '--nt-overlay-background',
    ]) {
      const row = composite(palette.get('--nt-row-active') ?? '', hexIn(palette, ground))
      expect(
        contrastRatio(hexIn(palette, '--nt-text-secondary'), row),
        ground,
      ).toBeGreaterThanOrEqual(4.5)
    }
  })

  test('--nt-control-border parts an empty box and an off switch from the canvas, the frame, the side panel and a card (≥ 3)', () => {
    for (const ground of [
      '--nt-canvas',
      '--nt-frame',
      '--nt-side-panel',
      '--nt-overlay-background',
    ]) {
      const edge = composite(palette.get('--nt-control-border') ?? '', hexIn(palette, ground))
      expect(contrastRatio(edge, hexIn(palette, ground)), ground).toBeGreaterThanOrEqual(3)
    }
  })

  test('an on switch and the words of a settings row read on the canvas, the frame, the side panel and a card', () => {
    // The accent track holds the 3:1 of a control's part; the title and the muted line under it are
    // text and hold AA, on every plane a row of `SettingSwitchRow` may stand on.
    for (const ground of [
      '--nt-canvas',
      '--nt-frame',
      '--nt-side-panel',
      '--nt-overlay-background',
    ]) {
      expect(
        contrastRatio(hexIn(palette, '--nt-accent'), hexIn(palette, ground)),
        ground,
      ).toBeGreaterThanOrEqual(3)
      expect(
        contrastRatio(hexIn(palette, '--nt-text-muted'), hexIn(palette, ground)),
        ground,
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contrastRatio(hexIn(palette, '--nt-text'), hexIn(palette, ground)),
        ground,
      ).toBeGreaterThanOrEqual(4.5)
    }
  })

  test('the thumb of an off switch stands out on the canvas, the frame, the side panel and a card (≥ 3)', () => {
    // An off switch is an outline with a muted thumb: the thumb is its one filled mark, so it holds
    // the 3:1 of a control's part (WCAG 1.4.11) on every plane a row stands on.
    for (const ground of [
      '--nt-canvas',
      '--nt-frame',
      '--nt-side-panel',
      '--nt-overlay-background',
    ]) {
      expect(
        contrastRatio(hexIn(palette, '--nt-text-muted'), hexIn(palette, ground)),
        ground,
      ).toBeGreaterThanOrEqual(3)
    }
  })

  test('--nt-text on a success tag reaches AA (≥ 4.5)', () => {
    const plane = composite(palette.get('--nt-success-subtle') ?? '', hexIn(palette, '--nt-canvas'))
    expect(contrastRatio(hexIn(palette, '--nt-text'), plane)).toBeGreaterThanOrEqual(4.5)
  })

  test('the muted words of a hovered or chosen ChoiceRow on a card step up to secondary, which reaches AA there', () => {
    // A question card lays its rows on a card; the plane of hover or choice (`surface-hover`) over
    // it brings muted (slate) under AA for 12px text in dark, so `ChoiceRow` lifts its number, tag
    // and description to secondary on that plane.
    const row = composite(
      palette.get('--nt-surface-hover') ?? '',
      hexIn(palette, '--nt-overlay-background'),
    )
    expect(contrastRatio(hexIn(palette, '--nt-text-secondary'), row)).toBeGreaterThanOrEqual(4.5)
  })

  test('--nt-text-muted on a card or menu reaches AA (≥ 4.5)', () => {
    expect(
      contrastRatio(hexIn(palette, '--nt-text-muted'), hexIn(palette, '--nt-overlay-background')),
    ).toBeGreaterThanOrEqual(4.5)
  })

  // The side panel is a ground for a status word (green 4.6:1 in light); the frame is not, a
  // status there is a glyph (`docs/family-style.md`, "The shell").
  test.each(['--nt-danger', '--nt-success', '--nt-attention'])(
    '%s as words on the canvas, the side panel and a menu reaches AA (≥ 4.5)',
    (tone) => {
      for (const surface of ['--nt-canvas', '--nt-side-panel', '--nt-overlay-background']) {
        expect(
          contrastRatio(hexIn(palette, tone), hexIn(palette, surface)),
          surface,
        ).toBeGreaterThanOrEqual(4.5)
      }
    },
  )

  test('the key plane on the accent fill keeps its words at AA (≥ 4.5)', () => {
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
  })

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
    '%s stands out as a glyph on the canvas, the side panel and the frame (≥ 3)',
    (kind) => {
      for (const surface of ['--nt-canvas', '--nt-side-panel', '--nt-frame']) {
        expect(
          contrastRatio(hexIn(palette, kind), hexIn(palette, surface)),
          surface,
        ).toBeGreaterThanOrEqual(3)
      }
    },
  )

  test('the frame lies a step below the canvas in both themes; planes, cards and menus stay white in light', () => {
    // The shell's three layers: the rail and the top bar on the frame, the floating plane of the
    // side panel and the content above it. The frame is the deepest in both themes; in light
    // (0.4.0 made it white) it is a step below Paper again, and what floats on the canvas stays
    // white.
    const frame = relativeLuminance(hexIn(palette, '--nt-frame'))
    const canvas = relativeLuminance(hexIn(palette, '--nt-canvas'))
    expect(frame).toBeLessThan(canvas)
    if (theme === 'dark') {
      // The brightness is the separation; no hairline, no shadow under a plane.
      expect(palette.get('--nt-frame-edge')).toBe('transparent')
      expect(palette.get('--nt-shadow-plane')).toBe('0 0 #0000')
    } else {
      for (const white of ['--nt-plane', '--nt-overlay-background', '--nt-composer']) {
        expect(palette.get(white), white).toBe('#ffffff')
      }
      // The hairline beside a sidebar of a host that keeps its own column on the frame.
      expect(palette.get('--nt-frame-edge')).toBe('var(--nt-border)')
    }
    // `bg` stays an alias of the canvas until every use has moved over.
    expect(palette.get('--nt-bg')).toBe('var(--nt-canvas)')
  })

  test('the side panel lies between the frame and the canvas in both themes', () => {
    const [frame, side, canvas] = ['--nt-frame', '--nt-side-panel', '--nt-canvas'].map((name) =>
      relativeLuminance(hexIn(palette, name)),
    )
    expect(frame).toBeLessThan(side ?? 0)
    expect(side).toBeLessThan(canvas ?? 0)
    expect(themeCss).toContain('--color-side-panel: var(--nt-side-panel);')
  })

  test('text, secondary and muted text keep their contrast on the side panel', () => {
    const side = hexIn(palette, '--nt-side-panel')
    expect(contrastRatio(hexIn(palette, '--nt-text'), side)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(hexIn(palette, '--nt-text-secondary'), side)).toBeGreaterThanOrEqual(7)
    expect(contrastRatio(hexIn(palette, '--nt-text-muted'), side)).toBeGreaterThanOrEqual(4.5)
  })

  test('the accent as text, the focus ring and the edge of an empty box stand out on the side panel', () => {
    const side = hexIn(palette, '--nt-side-panel')
    expect(contrastRatio(hexIn(palette, '--nt-accent-text'), side)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(hexIn(palette, '--nt-focus-ring'), side)).toBeGreaterThanOrEqual(3)
    const edge = composite(palette.get('--nt-control-border') ?? '', side)
    expect(contrastRatio(edge, side)).toBeGreaterThanOrEqual(3)
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

  test.each(['run', 'fail', 'block', 'stop'])(
    'the %s mark stands out as a status glyph on canvas, frame, side panel and a card (≥ 3)',
    (kind) => {
      for (const surface of [
        '--nt-canvas',
        '--nt-frame',
        '--nt-side-panel',
        '--nt-overlay-background',
      ]) {
        expect(
          contrastRatio(hexIn(palette, `--nt-status-${kind}`), hexIn(palette, surface)),
          surface,
        ).toBeGreaterThanOrEqual(3)
      }
    },
  )

  test('a menu lies on a layered shadow rather than one cloud', () => {
    expect((palette.get('--nt-shadow-menu') ?? '').split(',')).toHaveLength(3)
  })
})

describe('the light block', () => {
  test('repeats every colour token of the dark palette, so no dark value leaks into light', () => {
    const colours = [...tokens]
      .filter(([name, value]) => isColour(value) && !isConstant(name))
      .map(([name]) => name)
    expect(colours.length).toBeGreaterThan(50)
    const missing = colours.filter((name) => !lightOnly.has(name))
    expect(missing).toEqual([])
  })

  test('leaves the fixed colours of the family and the satellite alone', () => {
    expect([...lightOnly.keys()].filter(isConstant)).toEqual([])
  })

  test('names no token the dark palette lacks', () => {
    const extra = [...lightOnly.keys()].filter((name) => !tokens.has(name))
    expect(extra).toEqual([])
  })

  test('keeps the glow of a status mark to a whisper, where dark keeps it at full strength', () => {
    expect(tokens.get('--nt-status-glow')).toBe('1')
    expect(lightOnly.get('--nt-status-glow')).toBe('0.22')
    expect(tokens.has('--nt-status-gloss')).toBe(false)
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

describe('the satellite of a product', () => {
  /** The declarations of the rule for one `data-product`. */
  function product(name: string): Map<string, string> {
    const block = tokensCss.match(new RegExp(`\\n\\[data-product="${name}"\\]\\s*\\{([^}]*)\\}`))
    return parseDeclarations(block?.[1] ?? '')
  }

  test('is Orbit orange without a product', () => {
    expect(hexIn(tokens, '--nt-satellite')).toBe('#ff7f2a')
  })

  test.each([
    ['orbit', '#ff7f2a'],
    ['halo', '#2fd3a6'],
    ['fold', '#9b87ff'],
  ])('is chosen by data-product="%s"', (name, hex) => {
    const rule = product(name)
    expect(hexIn(new Map([...tokens, ...rule]), '--nt-satellite')).toBe(hex)
  })

  test('the satellites of Lens, Trail and Comet are fixed colours, declared once', () => {
    for (const [name, hex] of [
      ['--nt-brand-lens', '#ffb224'],
      ['--nt-brand-trail', '#ff4d6d'],
      ['--nt-brand-comet', '#4da3ff'],
    ] as const) {
      expect(tokens.get(name), name).toBe(hex)
      expect(tokensCss.split(`${name}:`).length - 1, name).toBe(1)
      expect(lightOnly.has(name), name).toBe(false)
    }
  })

  test.each([
    ['lens', '#ffb224'],
    ['trail', '#ff4d6d'],
    ['comet', '#4da3ff'],
  ])('data-product picks the satellite of Lens, Trail or Comet: %s', (name, hex) => {
    const rule = product(name)
    expect(hexIn(new Map([...tokens, ...rule]), '--nt-satellite')).toBe(hex)
  })

  test('is chosen after the light block, so a theme further in cannot take it back', () => {
    expect(tokensCss.indexOf('[data-product="halo"]')).toBeGreaterThan(
      tokensCss.indexOf('\n[data-theme="light"]'),
    )
  })

  test('is no role: no component draws a word, line or plane with it', () => {
    expect(themeCss).not.toMatch(
      /--color-(accent|focus|border)[a-z-]*:\s*var\(--nt-(satellite|brand-(orbit|halo|fold|lens|trail|comet))\)/,
    )
  })
})

describe('the density of a host', () => {
  /** The declarations of the rule for one `data-density`, an empty map when it is missing. */
  function density(name: string): Map<string, string> {
    const block = tokensCss.match(new RegExp(`\\n\\[data-density="${name}"\\]\\s*\\{([^}]*)\\}`))
    return parseDeclarations(block?.[1] ?? '')
  }

  const controlHeights = (palette: Map<string, string>) =>
    ['xs', 'sm', 'md', 'lg'].map((size) => palette.get(`--nt-control-${size}`))

  test('keeps the heights of 0.5.0 without a data-density', () => {
    expect(controlHeights(tokens)).toEqual(['24px', '28px', '32px', '40px'])
  })

  test('data-density="compact" lowers every control a step: 20, 24, 28 and 32px', () => {
    expect(controlHeights(new Map([...tokens, ...density('compact')]))).toEqual([
      '20px',
      '24px',
      '28px',
      '32px',
    ])
  })

  test('data-density="regular" brings the heights of 0.5.0 back inside a compact host', () => {
    const inside = new Map([...tokens, ...density('compact'), ...density('regular')])
    expect(controlHeights(inside)).toEqual(controlHeights(tokens))
  })

  test('a density sets heights only, never a colour', () => {
    for (const name of ['compact', 'regular']) {
      const rule = density(name)
      expect([...rule.keys()], name).toEqual([
        '--nt-control-xs',
        '--nt-control-sm',
        '--nt-control-md',
        '--nt-control-lg',
      ])
    }
  })

  test('survives a data-theme further in: the light block repeats no height', () => {
    for (const size of ['xs', 'sm', 'md', 'lg']) {
      expect(lightOnly.has(`--nt-control-${size}`), size).toBe(false)
    }
    expect(tokensCss.indexOf('[data-density="compact"]')).toBeGreaterThan(
      tokensCss.indexOf('\n[data-theme="light"]'),
    )
  })
})
