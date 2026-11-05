import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, test, vi } from 'vitest'
import {
  adjacentMarker,
  Scrubber,
  type ScrubberKind,
  ScrubberMark,
  type ScrubberMarker,
  scrubberEventText,
  scrubberGroups,
  scrubberLabels,
  scrubberTicks,
} from './Scrubber'

type Kind = 'klik' | 'fout' | 'navigatie'

const KINDS: Record<Kind, ScrubberKind> = {
  klik: { label: 'Klik', shape: 'dot' },
  fout: { label: 'Fout', shape: 'diamond', tone: 'danger' },
  navigatie: { label: 'Navigatie', shape: 'chevron' },
}

const MARKERS: ScrubberMarker<Kind>[] = [
  { at: 3, kind: 'klik', label: 'Klikt op In winkelmand' },
  { at: 12, kind: 'klik', label: 'Klikt op Betalen' },
  { at: 14, kind: 'fout', label: 'TypeError in Kassa.betaal' },
  { at: 20, kind: 'fout', label: 'TypeError in Kassa.betaal' },
]

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds) % 60).padStart(2, '0')}`

function Player({ start = 14, legend = true }: { start?: number; legend?: boolean }) {
  const [value, setValue] = useState(start)
  return (
    <Scrubber
      label="Afspeelpositie"
      duration={24}
      value={value}
      onValueChange={setValue}
      markers={MARKERS}
      kinds={KINDS}
      formatTime={clock}
      valueText={(seconds, here) =>
        [`${clock(seconds)} van 0:24`, ...here.map((marker) => marker.label)].join(', ')
      }
      {...(legend ? { legendLabel: 'Markeringen' } : {})}
      groupLabel={(count) => `${count} gebeurtenissen`}
    />
  )
}

describe('Scrubber', () => {
  test('the playhead is one slider named by its label, with the time in words', () => {
    render(<Player />)
    const slider = screen.getByRole('slider', { name: 'Afspeelpositie' })
    expect(slider).toHaveAttribute('aria-valuenow', '14')
    expect(slider).toHaveAttribute('aria-valuemax', '24')
    expect(slider).toHaveAttribute('aria-valuetext', '0:14 van 0:24, TypeError in Kassa.betaal')
  })

  test('the keys move the playhead: an arrow one step, End to the end', async () => {
    render(<Player />)
    const slider = screen.getByRole('slider', { name: 'Afspeelpositie' })
    slider.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(slider).toHaveAttribute('aria-valuetext', '0:15 van 0:24')
    await userEvent.keyboard('{End}')
    expect(slider).toHaveAttribute('aria-valuenow', '24')
  })

  test('a marker per event, at its share of the width, hidden from a screen reader', () => {
    const { container } = render(<Player />)
    const markers = [...container.querySelectorAll<HTMLElement>('[data-nt-scrubber-marker]')]
    expect(markers).toHaveLength(4)
    expect(markers[0]?.style.left).toBe('12.5%')
    expect(markers[1]?.style.left).toBe('50%')
    expect(markers[0]?.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(markers[0]).toHaveAttribute('tabindex', '-1')
  })

  test('a press on a marker seeks to its moment', () => {
    const { container } = render(<Player start={0} />)
    const marker = container.querySelector<HTMLElement>('[data-nt-scrubber-marker="fout"]')
    if (!marker) throw new Error('no marker')
    fireEvent.click(marker)
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '14')
  })

  test('on a marker the playhead stays neutral and its knob gives way to the mark', () => {
    const on = render(<Player start={14} />)
    expect(on.container.querySelector('[data-nt-scrubber-thumb]')).toHaveAttribute(
      'data-nt-scrubber-thumb',
      'on',
    )
    expect(on.container.querySelector('[data-nt-scrubber-thumb]')?.className).not.toMatch(/danger/)
    on.unmount()
    const free = render(<Player start={8} />)
    expect(free.container.querySelector('[data-nt-scrubber-thumb]')).toHaveAttribute(
      'data-nt-scrubber-thumb',
      'free',
    )
  })

  test('a group draws its leading shape only, never a faint copy behind it', () => {
    const { container } = render(<Player />)
    expect(container.querySelector('[data-nt-scrubber-stack]')).toBeNull()
    expect(container.querySelector('svg.opacity-45')).toBeNull()
  })

  test('on a mark the stem gives way to a bar under it, so no line runs through the shape', () => {
    const { container } = render(<Player start={14} />)
    const thumb = container.querySelector('[data-nt-scrubber-thumb="on"]')
    expect(thumb?.querySelector('.inset-y-0')).toBeNull()
    expect(thumb?.querySelectorAll('[data-nt-scrubber-under]')).toHaveLength(1)
  })

  test('the legend lists the kinds that occur, with their counts', () => {
    render(<Player />)
    const legend = screen.getByRole('list', { name: 'Markeringen' })
    expect([...legend.querySelectorAll('li')].map((item) => item.textContent)).toEqual([
      'Klik2',
      'Fout2',
    ])
  })

  test('the legend keeps the word of every kind in sight, never only its shape', () => {
    render(<Player />)
    const legend = screen.getByRole('list', { name: 'Markeringen' })
    for (const item of legend.querySelectorAll('li > span')) {
      expect(item.className).not.toMatch(/sr-only/)
    }
  })

  test('without a legend label there is no legend', () => {
    render(<Player legend={false} />)
    expect(screen.queryByRole('list')).toBeNull()
  })

  test('a recording of no length is disabled, with one tick at the start', () => {
    const { container } = render(
      <Scrubber
        label="Afspeelpositie"
        duration={0}
        value={0}
        onValueChange={() => {}}
        kinds={KINDS}
        formatTime={clock}
        valueText={() => 'Nog niet beschikbaar'}
      />,
    )
    expect(container.querySelector('[data-disabled]')).not.toBeNull()
    expect(container.textContent).toBe('0:00')
  })

  test('the pointer over the track names the time and a marker within reach', () => {
    const { container } = render(<Player />)
    const root = container.querySelector<HTMLElement>('[data-orientation="horizontal"]')
    if (!root) throw new Error('no root')
    root.getBoundingClientRect = () => ({
      left: 0,
      width: 240,
      top: 0,
      height: 32,
      right: 240,
      bottom: 32,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    fireEvent.pointerMove(root, { clientX: 141, pointerType: 'mouse' })
    expect(container.textContent).toContain('TypeError in Kassa.betaal')
    fireEvent.pointerLeave(root)
    expect(container.textContent).not.toContain('TypeError')
  })
})

describe('Scrubber hover card', () => {
  test('a kind that is not named shows only its own words, and a group heading gets the markers', () => {
    const groupLabel = vi.fn((count: number) => `${count} gebeurtenissen`)
    const { container } = render(
      <Scrubber
        label="Afspeelpositie"
        duration={24}
        value={0}
        onValueChange={() => {}}
        markers={MARKERS}
        kinds={{ ...KINDS, klik: { ...KINDS.klik, named: false } }}
        formatTime={clock}
        valueText={() => ''}
        groupLabel={groupLabel}
      />,
    )
    const root = container.querySelector<HTMLElement>('[data-orientation="horizontal"]')
    if (!root) throw new Error('no root')
    root.getBoundingClientRect = () => ({
      left: 0,
      width: 240,
      top: 0,
      height: 32,
      right: 240,
      bottom: 32,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    fireEvent.pointerMove(root, { clientX: 30, pointerType: 'mouse' })
    expect(container.textContent).toContain('Klikt op In winkelmand')
    expect(container.textContent).not.toContain('Klik ·')
    fireEvent.pointerMove(root, { clientX: 141, pointerType: 'mouse' })
    expect(container.textContent).toContain('Fout · TypeError in Kassa.betaal')
  })
})

describe('scrubberEventText', () => {
  test('names the kind before the words, unless the words already say it', () => {
    const marker = { label: 'Klikt op ‘Betalen’' }
    expect(scrubberEventText({ label: 'Fout', shape: 'diamond' }, { label: 'TypeError' })).toBe(
      'Fout · TypeError',
    )
    expect(scrubberEventText({ label: 'Klik', shape: 'dot', named: false }, marker)).toBe(
      'Klikt op ‘Betalen’',
    )
    expect(scrubberEventText({ label: 'Fout', shape: 'diamond' }, { label: 'X' }, ': ')).toBe(
      'Fout: X',
    )
  })
})

describe('ScrubberMark', () => {
  test('draws the shape of a kind without the edge of the track', () => {
    const { container } = render(<ScrubberMark kind={KINDS.fout} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg?.getAttribute('class')).toMatch(/text-danger/)
    expect(svg?.querySelectorAll('path')).toHaveLength(1)
  })
})

describe('scrubberTicks', () => {
  test.each([
    [24, [0, 5, 10, 15, 20]],
    [60, [0, 15, 30, 45, 60]],
    [721, [0, 300, 600]],
    [0, [0]],
  ])('%i seconds take round ticks', (duration, ticks) => {
    expect(scrubberTicks(duration)).toEqual(ticks)
  })
})

describe('scrubberGroups', () => {
  const near: ScrubberMarker<Kind>[] = [
    { at: 14.35, kind: 'fout', label: 'TypeError' },
    { at: 14.6, kind: 'klik', label: 'Klikt' },
    { at: 20, kind: 'fout', label: 'TypeError' },
  ]
  test.each([
    [0, [[14.35], [14.6], [20]]],
    [320, [[14.35, 14.6], [20]]],
    [4000, [[14.35], [14.6], [20]]],
  ])('on a track of %ipx, markers that would touch are one group', (width, groups) => {
    expect(
      scrubberGroups(near, 24, width).map((group) => group.markers.map((marker) => marker.at)),
    ).toEqual(groups)
  })

  test('what went wrong leads its group and is drawn at its own moment', () => {
    const groups = scrubberGroups(
      [
        { at: 19.1, kind: 'klik', label: 'Klikt opnieuw' },
        { at: 20.35, kind: 'fout', label: 'TypeError' },
      ],
      24,
      256,
      KINDS,
    )
    expect(groups.map((group) => [group.at, group.markers.length])).toEqual([[20.35, 2]])
  })
})

describe('scrubberLabels', () => {
  test.each([
    [24, 0, [0, 5, 10, 15, 20]],
    [24, 640, [0, 5, 10, 15, 20, 24]],
    [24, 340, [0, 10, 24]],
    [24, 300, [0, 10, 24]],
    [20, 640, [0, 5, 10, 15, 20]],
    // Round times only: 1:30 gives way to the end time 1:35, never 0:31 and 1:03.
    [95, 592, [0, 30, 60, 95]],
    // 10:00 would crowd 12:01.
    [721, 592, [0, 300, 721]],
  ])('%i seconds on a track of %ipx', (duration, width, labels) => {
    expect(scrubberLabels(duration, width)).toEqual(labels)
  })
})

describe('scrubberGroups with kinds: no two drawn shapes touch', () => {
  type Trail = 'fout' | 'verzoek' | 'klik' | 'navigatie'
  const TRAIL: Record<Trail, ScrubberKind> = {
    fout: { label: 'Fout', shape: 'diamond', tone: 'danger' },
    verzoek: { label: 'Mislukt verzoek', shape: 'ring', tone: 'danger' },
    klik: { label: 'Klik', shape: 'dot' },
    navigatie: { label: 'Navigatie', shape: 'chevron' },
  }
  const CHECKOUT: ScrubberMarker<Trail>[] = [
    { at: 0.2, kind: 'navigatie', label: '/' },
    { at: 3.1, kind: 'klik', label: 'In winkelmand' },
    { at: 5.8, kind: 'navigatie', label: '/kassa' },
    { at: 9.2, kind: 'klik', label: 'Bank' },
    { at: 12.6, kind: 'klik', label: 'Betalen' },
    { at: 14.35, kind: 'fout', label: 'TypeError' },
    { at: 14.6, kind: 'verzoek', label: '500' },
    { at: 19.1, kind: 'klik', label: 'Opnieuw' },
    { at: 20.35, kind: 'fout', label: 'TypeError' },
    { at: 20.6, kind: 'verzoek', label: '500' },
    { at: 23.0, kind: 'navigatie', label: '/' },
  ]
  test.each([272, 288, 340, 400, 624])('on a track of %ipx', (width) => {
    const groups = scrubberGroups(CHECKOUT, 24, width, TRAIL)
    // A group with an error and a failed request draws two shapes, 32px wide; any other one.
    const extents = groups.map((group) => {
      const x = (group.at / 24) * width
      const pair = new Set(group.markers.map((marker) => TRAIL[marker.kind].tone)).has('danger')
        ? group.markers.some((m) => m.kind === 'fout') &&
          group.markers.some((m) => m.kind === 'verzoek')
        : false
      if (!pair) return [x - 7, x + 7] as const
      return x + 25 > width + 8 ? ([x - 25, x + 7] as const) : ([x - 7, x + 25] as const)
    })
    for (let index = 1; index < extents.length; index += 1) {
      const left = extents[index - 1]
      const right = extents[index]
      if (!left || !right) throw new Error('no extent')
      expect(right[0] - left[1]).toBeGreaterThanOrEqual(6)
    }
    // Every marker is still in a group, and an error still leads its own.
    expect(groups.flatMap((group) => group.markers)).toHaveLength(CHECKOUT.length)
    expect(
      groups.filter((group) => group.markers.some((m) => m.kind === 'fout')).map((g) => g.at),
    ).toEqual([14.35, 20.35])
  })
})

describe('adjacentMarker', () => {
  test('finds the next and the previous error, past the one the playhead stands on', () => {
    expect(adjacentMarker(MARKERS, 14, 'next', ['fout'])?.at).toBe(20)
    expect(adjacentMarker(MARKERS, 14, 'previous', ['fout'])).toBeUndefined()
    expect(adjacentMarker(MARKERS, 20, 'previous', ['fout'])?.at).toBe(14)
    expect(adjacentMarker(MARKERS, 13, 'previous')?.at).toBe(12)
  })
})
