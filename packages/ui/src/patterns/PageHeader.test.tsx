import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { PageCrumbs, PageHeader } from './PageHeader'

test('draws one h1 with the meta line under it', () => {
  const { container } = render(<PageHeader title="Wacht op jou" meta="3 beslissen · 2 nakijken" />)
  const header = container.querySelector('[data-nt-page-header]')
  expect(header).not.toBeNull()
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  expect(screen.getByRole('heading', { level: 1, name: 'Wacht op jou' })).toBeInTheDocument()
  expect(header?.querySelector('[data-nt-page-meta]')).toHaveTextContent('3 beslissen · 2 nakijken')
})

test('draws the title at 20px in the heading weight in a strip of 40px', () => {
  render(<PageHeader title="Gearchiveerd" />)
  const heading = screen.getByRole('heading', { level: 1 })
  expect(heading.className).toContain('text-[20px]')
  expect(heading.className).toContain('font-heading')
  expect(heading.parentElement?.className).toContain('h-10')
})

test('leaves the meta line out when there is none', () => {
  const { container } = render(<PageHeader title="Artifacts" />)
  expect(container.querySelector('[data-nt-page-meta]')).toBeNull()
})

test('puts the actions in the strip of the title', () => {
  render(<PageHeader title="Gearchiveerd" actions={<button type="button">Zoek</button>} />)
  const heading = screen.getByRole('heading', { level: 1 })
  expect(heading.parentElement).toContainElement(screen.getByRole('button', { name: 'Zoek' }))
})

test('gives the title the id a region names itself by', () => {
  render(<PageHeader title="Nieuwe feature" titleId="start-title" />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('id', 'start-title')
})

test('makes every crumb but the last a button that goes there', async () => {
  const onSpecs = vi.fn()
  render(
    <PageCrumbs
      label="Kruimelpad"
      trail={[
        { label: 'Specs', onSelect: onSpecs },
        { label: 'SPEC-1', mono: true },
      ]}
    />,
  )
  const nav = screen.getByRole('navigation', { name: 'Kruimelpad' })
  expect(nav).toHaveTextContent('SpecsSPEC-1')
  await userEvent.click(screen.getByRole('button', { name: 'Specs' }))
  expect(onSpecs).toHaveBeenCalledOnce()
  expect(screen.queryByRole('button', { name: 'SPEC-1' })).toBeNull()
  expect(screen.getByText('SPEC-1').closest('[aria-current="page"]')).not.toBeNull()
})
