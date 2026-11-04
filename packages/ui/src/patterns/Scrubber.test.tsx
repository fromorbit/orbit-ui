import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, test } from 'vitest'
import {
  adjacentMarker,
  Scrubber,
  type ScrubberKind,
  type ScrubberMarker,
  scrubberGroups,
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

function Player({
  start = 14,
  legend = true,
  action,
}: {
  start?: number
  legend?: boolean
  action?: string
}) {
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
      {...(action ? { legendActions: { fout: <span>{action}</span> } } : {})}
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

  test('on a marker the thumb opens into a ring in its tone', () => {
    const on = render(<Player start={14} />)
    expect(on.container.querySelector('[data-nt-scrubber-thumb]')).toHaveAttribute(
      'data-nt-scrubber-thumb',
      'danger',
    )
    on.unmount()
    const free = render(<Player start={8} />)
    expect(free.container.querySelector('[data-nt-scrubber-thumb]')).toHaveAttribute(
      'data-nt-scrubber-thumb',
      'free',
    )
  })

  test('the legend lists the kinds that occur, with their counts', () => {
    render(<Player />)
    const legend = screen.getByRole('list', { name: 'Markeringen' })
    expect([...legend.querySelectorAll('li')].map((item) => item.textContent)).toEqual([
      'Klik2',
      'Fout2',
    ])
  })

  test("a legend action takes the place of its kind's count", () => {
    render(<Player action="1 van 2" />)
    const legend = screen.getByRole('list', { name: 'Markeringen' })
    expect([...legend.querySelectorAll('li')].map((item) => item.textContent)).toEqual([
      'Klik2',
      'Fout1 van 2',
    ])
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
    [1600, [[14.35], [14.6], [20]]],
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

describe('adjacentMarker', () => {
  test('finds the next and the previous error, past the one the playhead stands on', () => {
    expect(adjacentMarker(MARKERS, 14, 'next', ['fout'])?.at).toBe(20)
    expect(adjacentMarker(MARKERS, 14, 'previous', ['fout'])).toBeUndefined()
    expect(adjacentMarker(MARKERS, 20, 'previous', ['fout'])?.at).toBe(14)
    expect(adjacentMarker(MARKERS, 13, 'previous')?.at).toBe(12)
  })
})
