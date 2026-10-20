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
