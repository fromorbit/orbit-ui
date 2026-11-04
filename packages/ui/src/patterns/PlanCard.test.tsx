import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { Button } from '../primitives/Button'
import { PlanCard, PlanCards } from './PlanCard'

test('a plan is an article named by the plan, with its price, period and features', () => {
  render(
    <PlanCard
      name="Team"
      price="€ 24"
      period="per lid per maand, excl. btw"
      features={[
        'Onbeperkt gesprekken',
        { label: '250 agent-uren per maand', detail: '182 u gebruikt' },
      ]}
    />,
  )
  const card = screen.getByRole('article', { name: 'Team' })
  expect(card).toHaveTextContent('€ 24per lid per maand, excl. btw')
  const lines = within(card).getAllByRole('listitem')
  // The figure is read after a comma, not run into the label.
  expect(lines.map((line) => line.textContent)).toEqual([
    'Onbeperkt gesprekken',
    '250 agent-uren per maand, 182 u gebruikt',
  ])
  expect(card).not.toHaveAttribute('data-current')
})

test('the current plan says so in its heading, and carries the data attribute', () => {
  render(<PlanCard name="Team" price="€ 24" current currentLabel="Huidig plan" />)
  const card = screen.getByRole('article', { name: /^Team\W+Huidig plan$/ })
  expect(card).toHaveAttribute('data-current')
  expect(screen.getByRole('heading', { name: /^Team\W+Huidig plan$/ })).toBeInTheDocument()
})

test('the name is a heading of the given level', () => {
  render(<PlanCard name="Bedrijf" price="€ 39" headingLevel={2} />)
  expect(screen.getByRole('heading', { level: 2, name: 'Bedrijf' })).toBeInTheDocument()
})

test('summary and action stand in the foot; without either there is no foot', () => {
  const { rerender } = render(
    <PlanCard
      name="Team"
      price="€ 24"
      summary="6 leden"
      action={<Button variant="secondary">Plan wijzigen</Button>}
    />,
  )
  const card = screen.getByRole('article', { name: 'Team' })
  expect(within(card).getByRole('button', { name: 'Plan wijzigen' })).toBeInTheDocument()
  expect(card).toHaveTextContent('6 leden')
  rerender(<PlanCard name="Team" price="€ 24" />)
  const bare = screen.getByRole('article', { name: 'Team' })
  expect(within(bare).queryByRole('button')).toBeNull()
  expect(bare).toHaveTextContent(/^Team€ 24$/)
})

test('the action is described by its plan, so two actions in a row are told apart', () => {
  render(
    <PlanCards label="Plannen">
      <PlanCard name="Solo" price="€ 0" action={<Button variant="secondary">Overstappen</Button>} />
      <PlanCard
        name="Bedrijf"
        price="€ 39"
        action={<Button variant="secondary">Overstappen</Button>}
      />
    </PlanCards>,
  )
  const list = screen.getByRole('list', { name: 'Plannen' })
  expect(within(list).getAllByRole('listitem')).toHaveLength(2)
  const [solo, bedrijf] = screen.getAllByRole('button', { name: 'Overstappen' })
  expect(solo).toHaveAccessibleDescription('Solo')
  expect(bedrijf).toHaveAccessibleDescription('Bedrijf')
})

test('an action that brings its own description keeps it', () => {
  render(
    <>
      <span id="eigen">Eigen uitleg</span>
      <PlanCard
        name="Team"
        price="€ 24"
        action={
          <Button variant="secondary" aria-describedby="eigen">
            Plan wijzigen
          </Button>
        }
      />
    </>,
  )
  expect(screen.getByRole('button', { name: 'Plan wijzigen' })).toHaveAccessibleDescription(
    'Eigen uitleg',
  )
})

test('the current plan is lifted the same way on either plane; every alternative stays at rest', () => {
  render(
    <>
      <PlanCard name="Team" price="€ 24" current currentLabel="Huidig plan" plane="surface" />
      <PlanCard name="Bedrijf" price="€ 39" plane="surface" />
      <PlanCard name="Solo" price="€ 0" />
    </>,
  )
  const team = screen.getByRole('article', { name: /^Team\W+Huidig plan$/ })
  expect(team.className).toContain('bg-overlay')
  expect(team.className).toContain('from-row-active')
  expect(team.className).not.toContain('accent')
  expect(screen.getByRole('article', { name: 'Bedrijf' }).className).toMatch(/\bbg-plane\b/)
  expect(screen.getByRole('article', { name: 'Solo' }).className).toMatch(/\bbg-overlay\b/)
  expect(screen.getByRole('article', { name: 'Solo' }).className).not.toContain('accent')
})

test('the heading is read as "Team, Huidig plan", with no space before the comma', () => {
  render(<PlanCard name="Team" price="€ 24" current currentLabel="Huidig plan" />)
  const heading = screen.getByRole('heading', { name: /Huidig plan/ })
  expect(heading).toHaveAccessibleName('Team, Huidig plan')
})

test('the quiet words of the current plan step up to secondary; at rest they stay muted', () => {
  const props = {
    price: '€ 24',
    period: 'per lid per maand',
    features: [{ label: '250 agent-uren', detail: '182 u gebruikt' }],
    summary: '6 leden',
  }
  render(
    <>
      <PlanCard name="Team" {...props} current currentLabel="Huidig plan" />
      <PlanCard name="Bedrijf" {...props} />
    </>,
  )
  const team = screen.getByRole('article', { name: /^Team\W+Huidig plan$/ })
  const bedrijf = screen.getByRole('article', { name: 'Bedrijf' })
  for (const word of [/^per lid per maand$/, /^,?\s*182 u gebruikt$/, /^6 leden$/]) {
    expect(within(team).getByText(word).closest('[class*="text-"]')?.className).toContain(
      'text-secondary',
    )
    expect(within(bedrijf).getByText(word).closest('[class*="text-"]')?.className).toContain(
      'text-muted',
    )
  }
})

test('a line with its use carries a meter named by the label, heard once', () => {
  render(
    <PlanCard
      name="Team"
      price="€ 24"
      features={[
        {
          label: '250 agent-uren per maand',
          detail: '182 van 250 u',
          used: { value: 182, max: 250 },
        },
      ]}
    />,
  )
  const meter = screen.getByRole('meter', { name: '250 agent-uren per maand' })
  expect(meter).toHaveAttribute('aria-valuenow', '182')
  expect(meter).toHaveAttribute('aria-valuemax', '250')
  expect(meter).toHaveAttribute('aria-valuetext', '182 van 250 u')
  // The visible figure is the meter's to say, so a screen reader does not hear it twice.
  expect(screen.getByText('182 van 250 u')).toHaveAttribute('aria-hidden', 'true')
  const fill = meter.querySelector<HTMLElement>('[data-nt-meter-fill]')
  expect(fill?.style.width).toBe('73%')
  expect(fill?.className).toContain('bg-secondary')
})

test('a line past the plan takes the tone of attention and says where it ends', () => {
  render(
    <PlanCard
      name="Team"
      price="€ 24"
      features={[
        {
          label: '250 agent-uren per maand',
          detail: '263 van 250 u',
          used: { value: 263, max: 250 },
          over: '13 u boven je plan',
        },
        {
          label: 'Orbit Review op 10 repositories',
          detail: '7 van 10',
          used: { value: 7, max: 10 },
        },
      ]}
    />,
  )
  const meter = screen.getByRole('meter', { name: '250 agent-uren per maand' })
  expect(meter).toHaveAttribute('aria-valuetext', '263 van 250 u, 13 u boven je plan')
  const fill = meter.querySelector<HTMLElement>('[data-nt-meter-fill]')
  // Clamped to its end, in attention.
  expect(fill?.style.width).toBe('100%')
  expect(fill?.className).toContain('bg-attention-fill')
  expect(screen.getByText('263 van 250 u').className).toContain('text-attention')
  expect(screen.getByText('13 u boven je plan').className).toContain('text-attention')
  // The other lines stay quiet.
  expect(screen.getByText('7 van 10').className).not.toContain('attention')
  const quiet = screen.getByRole('meter', { name: 'Orbit Review op 10 repositories' })
  expect(quiet.querySelector('[data-nt-meter-fill]')?.className).toContain('bg-secondary')
})

test('without a meter, the words past the plan are read as the end of the line', () => {
  render(
    <PlanCard
      name="Team"
      price="€ 24"
      features={[{ label: '250 agent-uren', detail: '263 u', over: '13 u boven je plan' }]}
    />,
  )
  expect(screen.queryByRole('meter')).toBeNull()
  expect(screen.getByRole('listitem')).toHaveTextContent(
    '250 agent-uren, 263 u, 13 u boven je plan',
  )
})

test('the figure may wrap under its label instead of squeezing it', () => {
  render(
    <PlanCard
      name="Team"
      price="€ 24"
      features={[{ label: '250 agent-uren per maand', detail: '182 van 250 agent-uren gebruikt' }]}
    />,
  )
  const label = screen.getByText('250 agent-uren per maand')
  expect(label.className).toContain('basis-40')
  expect(label.parentElement?.className).toContain('flex-wrap')
})

// The tokens, read from disk: happy-dom applies no stylesheet.
const tokensCss = readFileSync(join(import.meta.dirname, '..', 'tokens.css'), 'utf8')

/** The declarations of a block of tokens.css: the root (dark) one, or the light one. */
function block(theme: 'dark' | 'light'): Map<string, string> {
  const css =
    theme === 'light'
      ? (tokensCss.match(/\n\[data-theme="light"\]\s*{([^}]*)}/)?.[1] ?? '')
      : tokensCss
  const map = new Map<string, string>()
  for (const [, name, value] of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    if (name !== undefined && value !== undefined && !map.has(name)) map.set(name, value.trim())
  }
  return map
}

const dark = block('dark')
const light = new Map([...dark, ...block('light')])

/** A token as an RGBA colour, through its `var()` chain. */
function color(tokens: Map<string, string>, name: string): [number, number, number, number] {
  let value = tokens.get(name) ?? ''
  for (let step = 0; step < 5; step += 1) {
    const next = value.match(/^var\((--[a-z0-9-]+)\)$/)?.[1]
    if (next === undefined) break
    value = tokens.get(next) ?? ''
  }
  const hex = value.match(/^#([0-9a-f]{6})$/i)?.[1]
  if (hex !== undefined) {
    return [0, 2, 4].map((at) => Number.parseInt(hex.slice(at, at + 2), 16)).concat(1) as [
      number,
      number,
      number,
      number,
    ]
  }
  const rgb = value.match(/^rgb\((\d+) (\d+) (\d+)(?: \/ ([\d.]+))?\)$/)
  if (!rgb) throw new Error(`${name} is not a colour: ${value}`)
  return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), Number(rgb[4] ?? 1)]
}

/** Lays colours over each other, the first opaque. */
function layer(...colours: [number, number, number, number][]): number[] {
  const [base, ...rest] = colours
  let out = (base ?? [0, 0, 0, 1]).slice(0, 3)
  for (const [r, g, b, a] of rest) out = out.map((c, i) => c + ([r, g, b][i]! - c) * a)
  return out
}

function contrast(a: number[], b: number[]): number {
  const lum = (c: number[]) => {
    const [r, g, b] = c.map((v) => {
      const s = v / 255
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    }) as [number, number, number]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p) as [number, number]
  return (x + 0.05) / (y + 0.05)
}

describe.each([
  ['dark', dark],
  ['light', light],
] as const)('the quiet words reach AA on every plane and state (%s)', (_theme, tokens) => {
  const c = (name: string) => color(tokens, name)
  const planes = {
    'overlay at rest': [layer(c('--nt-overlay-background')), '--nt-text-muted'],
    'surface at rest': [layer(c('--nt-canvas'), c('--nt-surface')), '--nt-text-muted'],
    // The current plan lies on the plane of a card with the tint of a lit row, on either plane.
    current: [layer(c('--nt-overlay-background'), c('--nt-row-active')), '--nt-text-secondary'],
    // A line past the plan, on the plane of a card and on the current plan.
    'attention at rest': [layer(c('--nt-overlay-background')), '--nt-attention'],
    'attention on the current plan': [
      layer(c('--nt-overlay-background'), c('--nt-row-active')),
      '--nt-attention',
    ],
  } as const
  test.each(Object.entries(planes))('%s', (_plane, [ground, text]) => {
    expect(contrast(layer(c(text)), ground)).toBeGreaterThanOrEqual(4.5)
  })
})
