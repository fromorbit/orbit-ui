import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { acceptsFile, FileDrop } from './FileDrop'

const LABELS = {
  title: 'Sleep bestanden hierheen',
  browse: 'of kies bestanden',
  hint: 'PDF of afbeelding, tot 10 MB',
  dropping: 'Laat los om toe te voegen',
}

const pdf = new File(['%PDF'], 'rapport.pdf', { type: 'application/pdf' })
const png = new File(['png'], 'scherm.png', { type: 'image/png' })
const zip = new File(['zip'], 'bron.zip', { type: 'application/zip' })

describe('acceptsFile', () => {
  test.each([
    [pdf, '.pdf', true],
    [pdf, 'image/*,.pdf', true],
    [png, 'image/*', true],
    [png, 'image/png', true],
    [zip, 'image/*, .pdf', false],
    [zip, undefined, true],
    [zip, '', true],
  ] as const)('%s with %s: %s', (file, accept, fits) => {
    expect(acceptsFile(file, accept)).toBe(fits)
  })
})

/** A drop of `files` on the zone, as a browser fires it. */
function drop(zone: HTMLElement, files: File[]) {
  fireEvent.drop(zone, { dataTransfer: { files } })
}

test('the zone is one button, named by its words and described by the hint', () => {
  render(<FileDrop labels={LABELS} onFiles={vi.fn()} />)
  const zone = screen.getByRole('button', { name: /Sleep bestanden hierheen of kies bestanden/ })
  expect(zone).toHaveAccessibleDescription('PDF of afbeelding, tot 10 MB')
})

test('Enter opens the file dialog; what is chosen arrives', async () => {
  const onFiles = vi.fn()
  const { container } = render(<FileDrop labels={LABELS} onFiles={onFiles} accept=".pdf" />)
  const input = container.querySelector('input[type="file"]') as HTMLInputElement
  expect(input).toHaveAttribute('accept', '.pdf')
  const click = vi.spyOn(input, 'click')
  await userEvent.tab()
  await userEvent.keyboard('{Enter}')
  expect(click).toHaveBeenCalled()
  await userEvent.upload(input, pdf)
  expect(onFiles).toHaveBeenCalledWith([pdf])
})

test('a drop gives what fits to onFiles and the rest to onReject', () => {
  const onFiles = vi.fn()
  const onReject = vi.fn()
  render(<FileDrop labels={LABELS} onFiles={onFiles} onReject={onReject} accept="image/*,.pdf" />)
  drop(screen.getByRole('button'), [pdf, zip, png])
  expect(onFiles).toHaveBeenCalledWith([pdf, png])
  expect(onReject).toHaveBeenCalledWith([zip])
})

test('single takes the first file of a drop', () => {
  const onFiles = vi.fn()
  render(<FileDrop labels={LABELS} onFiles={onFiles} single />)
  drop(screen.getByRole('button'), [pdf, png])
  expect(onFiles).toHaveBeenCalledWith([pdf])
})

test('files over the zone change its words until they leave', () => {
  render(<FileDrop labels={LABELS} onFiles={vi.fn()} />)
  const zone = screen.getByRole('button')
  fireEvent.dragEnter(zone)
  expect(zone).toHaveTextContent('Laat los om toe te voegen')
  fireEvent.dragLeave(zone)
  expect(zone).toHaveTextContent('Sleep bestanden hierheen')
})

test('a disabled zone takes no drop', () => {
  const onFiles = vi.fn()
  render(<FileDrop labels={LABELS} onFiles={onFiles} disabled />)
  drop(screen.getByRole('button'), [pdf])
  expect(onFiles).not.toHaveBeenCalled()
})

test('an error replaces the hint, describes the zone and is announced', () => {
  render(<FileDrop labels={LABELS} onFiles={vi.fn()} error="bron.zip past niet: kies een PDF." />)
  const zone = screen.getByRole('button')
  expect(zone).toHaveAttribute('aria-invalid', 'true')
  expect(zone).toHaveAccessibleDescription('bron.zip past niet: kies een PDF.')
  expect(screen.getByRole('alert')).toHaveTextContent('bron.zip past niet: kies een PDF.')
})
