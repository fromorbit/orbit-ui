import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { Pagination, pageItems } from './Pagination'

const LABELS = {
  label: "Pagina's",
  previous: 'Vorige pagina',
  next: 'Volgende pagina',
  page: (page: number) => `Pagina ${page}`,
  range: (from: number, to: number, total: number) => `${from}–${to} van ${total}`,
  perPage: 'Per pagina',
}

describe('pageItems', () => {
  test.each([
    [1, 5, [1, 2, 3, 4, 5]],
    [1, 20, [1, 2, 3, 4, 5, 'gap', 20]],
    [10, 20, [1, 'gap', 9, 10, 11, 'gap', 20]],
    [20, 20, [1, 'gap', 16, 17, 18, 19, 20]],
    [4, 20, [1, 2, 3, 4, 5, 'gap', 20]],
    [5, 20, [1, 'gap', 4, 5, 6, 'gap', 20]],
    [3, 8, [1, 2, 3, 4, 5, 'gap', 8]],
  ] as const)('page %i of %i', (page, count, items) => {
    expect(pageItems(page, count)).toEqual(items)
  })

  test('never a gap of one page, never more than seven places', () => {
    for (let count = 1; count <= 30; count++) {
      for (let page = 1; page <= count; page++) {
        const items = pageItems(page, count)
        expect(items.length).toBeLessThanOrEqual(7)
        items.forEach((item, index) => {
          if (item !== 'gap') return
          const before = items[index - 1] as number
          const after = items[index + 1] as number
          expect(after - before).toBeGreaterThan(2)
        })
      }
    }
  })
})

test('a named landmark with the count and the current page marked', () => {
  render(<Pagination page={2} total={128} pageSize={25} onPageChange={vi.fn()} labels={LABELS} />)
  expect(screen.getByRole('navigation', { name: "Pagina's" })).toHaveTextContent('26–50 van 128')
  expect(screen.getByRole('button', { name: 'Pagina 2' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('button', { name: 'Pagina 3' })).not.toHaveAttribute('aria-current')
})

test('before, after and a page ask for that page', async () => {
  const onPageChange = vi.fn()
  render(
    <Pagination page={2} total={128} pageSize={25} onPageChange={onPageChange} labels={LABELS} />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Vorige pagina' }))
  expect(onPageChange).toHaveBeenLastCalledWith(1)
  await userEvent.click(screen.getByRole('button', { name: 'Volgende pagina' }))
  expect(onPageChange).toHaveBeenLastCalledWith(3)
  await userEvent.click(screen.getByRole('button', { name: 'Pagina 6' }))
  expect(onPageChange).toHaveBeenLastCalledWith(6)
})

test('the ends disable their own direction', () => {
  const { rerender } = render(
    <Pagination page={1} total={50} pageSize={25} onPageChange={vi.fn()} labels={LABELS} />,
  )
  expect(screen.getByRole('button', { name: 'Vorige pagina' })).toBeDisabled()
  rerender(<Pagination page={2} total={50} pageSize={25} onPageChange={vi.fn()} labels={LABELS} />)
  expect(screen.getByRole('button', { name: 'Volgende pagina' })).toBeDisabled()
})

test('the page size is a choice when asked for', () => {
  render(
    <Pagination
      page={1}
      total={128}
      pageSize={25}
      pageSizes={[10, 25, 50]}
      onPageSizeChange={vi.fn()}
      onPageChange={vi.fn()}
      labels={LABELS}
    />,
  )
  expect(screen.getByRole('combobox', { name: 'Per pagina' })).toHaveTextContent('25')
})
