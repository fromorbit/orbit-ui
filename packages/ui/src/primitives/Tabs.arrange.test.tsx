import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import { Tabs } from './Tabs'

const tabs = [
  { id: 'a', label: 'Uiterlijk', content: <p>Inhoud A</p> },
  { id: 'b', label: 'Agents', content: <p>Inhoud B</p> },
]

test('an arranged list and panel stand where the caller places them', async () => {
  render(
    <Tabs
      label="Onderdelen"
      tabs={tabs}
      arrange={({ list, panels }) => (
        <>
          <div data-testid="column">{list}</div>
          <div data-testid="body">{panels}</div>
        </>
      )}
    />,
  )
  const column = screen.getByTestId('column')
  const body = screen.getByTestId('body')
  expect(column).toContainElement(screen.getByRole('tablist', { name: 'Onderdelen' }))
  expect(body).toContainElement(screen.getByRole('tabpanel'))
  await userEvent.click(screen.getByRole('tab', { name: 'Agents' }))
  expect(body).toHaveTextContent('Inhoud B')
})

test('an arranged list has the 32px rows of a column', () => {
  render(
    <Tabs
      label="Onderdelen"
      tabs={tabs}
      arrange={({ list, panels }) => (
        <>
          {list}
          {panels}
        </>
      )}
    />,
  )
  expect(screen.getByRole('tab', { name: 'Uiterlijk' }).className).toContain('--nt-control-lg')
})
