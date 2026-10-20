import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { Thumbnail } from './Thumbnail'

const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

test('is a button named by its label, with the image as decoration', async () => {
  const onClick = vi.fn()
  render(<Thumbnail label="Beeld van A1" src={PIXEL} onClick={onClick} />)
  const button = screen.getByRole('button', { name: 'Beeld van A1' })
  expect(button.querySelector('img')).toHaveAttribute('alt', '')
  await userEvent.click(button)
  expect(onClick).toHaveBeenCalledOnce()
})

test('stands as an empty frame while the image loads', () => {
  render(<Thumbnail label="Beeld van A1" src={null} />)
  expect(screen.getByRole('button', { name: 'Beeld van A1' }).querySelector('img')).toBeNull()
})
