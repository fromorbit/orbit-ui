import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import { SettingFoldRow } from './SettingFoldRow'

test('without rows it is plain text: name, line and status word', () => {
  render(
    <SettingFoldRow
      label="Nova"
      description="4 modellen"
      status={{ tone: 'success', label: 'Klaar' }}
    />,
  )
  expect(screen.queryByRole('button')).toBeNull()
  expect(screen.getByText('Nova')).toBeInTheDocument()
  expect(screen.getByText('4 modellen')).toBeInTheDocument()
  expect(screen.getByText('Klaar')).toBeInTheDocument()
  // The dot says nothing on its own; the word does.
  expect(document.querySelector('[data-nt-fold-status="success"]')).toHaveAttribute(
    'aria-hidden',
    'true',
  )
})

test('with rows the row is a button that folds them open and shut', async () => {
  render(
    <SettingFoldRow label="Lumen" status={{ tone: 'off', label: 'Niet gevonden' }}>
      <p>Programma</p>
    </SettingFoldRow>,
  )
  const toggle = screen.getByRole('button', { name: /Lumen/ })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByText('Programma')).toBeNull()
  await userEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByText('Programma')).toBeInTheDocument()
  expect(toggle).toHaveAttribute('aria-controls', screen.getByText('Programma').parentElement?.id)
  await userEvent.click(toggle)
  expect(screen.queryByText('Programma')).toBeNull()
})

test('it can start open', () => {
  render(
    <SettingFoldRow label="Lumen" defaultOpen>
      <p>Programma</p>
    </SettingFoldRow>,
  )
  expect(screen.getByRole('button', { name: /Lumen/ })).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByText('Programma')).toBeInTheDocument()
})

test('on a narrow row the chevron keeps its place at the end and only the status wraps', () => {
  render(
    <SettingFoldRow label="Omgeving" status={{ tone: 'off', label: 'Niet gevonden' }}>
      <p>Docker</p>
    </SettingFoldRow>,
  )
  // jsdom lays nothing out, so the rule is read from the row's parts: under 480px the group of
  // status and chevron dissolves into the row, the status alone goes to a line of its own, and
  // the label no longer takes the whole first line, so the chevron stays beside it.
  const word = document.querySelector('[data-nt-fold-status-word]')
  expect(word).toHaveClass('@max-[30rem]:order-last', '@max-[30rem]:basis-full')
  expect(word?.parentElement).toHaveClass('@max-[30rem]:contents')
  const slot = document.querySelector('[data-nt-fold-slot]')
  expect(slot).not.toHaveClass('@max-[30rem]:basis-full')
  expect(screen.getByText('Omgeving').parentElement).not.toHaveClass('@max-[30rem]:basis-full')
})
