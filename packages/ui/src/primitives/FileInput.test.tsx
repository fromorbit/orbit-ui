import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { expect, test } from 'vitest'
import { FileInput } from './FileInput'

test('choosing a file hands it to onFiles', async () => {
  const chosen: File[][] = []
  render(<FileInput onFiles={(files) => chosen.push(files)} />)
  const file = new File(['inhoud'], 'notities.md', { type: '' })
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  await userEvent.upload(input, file)
  expect(chosen).toEqual([[file]])
})

test('the input takes multiple files and no accept filter', () => {
  render(<FileInput onFiles={() => {}} />)
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  expect(input).toHaveAttribute('multiple')
  expect(input).not.toHaveAttribute('accept')
})

test('the input is hidden from sight and the tab order, but reachable through its ref', () => {
  const ref = createRef<HTMLInputElement>()
  render(<FileInput ref={ref} onFiles={() => {}} />)
  expect(ref.current).toBeInstanceOf(HTMLInputElement)
  expect(ref.current).toHaveAttribute('aria-hidden', 'true')
  expect(ref.current).toHaveAttribute('tabindex', '-1')
})

test('choosing the same file twice still fires onFiles both times', async () => {
  const chosen: File[][] = []
  render(<FileInput onFiles={(files) => chosen.push(files)} />)
  const file = new File(['x'], 'een.md', { type: '' })
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  await userEvent.upload(input, file)
  await userEvent.upload(input, file)
  expect(chosen).toHaveLength(2)
})
