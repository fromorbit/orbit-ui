import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { GitHubLink } from './GitHubLink'

test('a chip is a button named after its kind and number, with the full reference as title', () => {
  render(
    <p>
      Zie{' '}
      <GitHubLink
        label="Pull request 123"
        text="#123"
        kind="pull"
        number={123}
        title="voorbeeld/webwinkel#123"
        onOpen={() => {}}
      />
    </p>,
  )
  const chip = screen.getByRole('button', { name: 'Pull request 123' })
  expect(chip).toHaveAttribute('title', 'voorbeeld/webwinkel#123')
  // The mark is decoration; the words are the reference as it reads.
  expect(chip.textContent).toBe('#123')
  expect(chip.querySelector('svg[data-nt-brand="github"]')).toHaveAttribute('aria-hidden', 'true')
})

test('an issue and a bare number say what they are', () => {
  render(
    <GitHubLink
      label="Issue 9"
      text="kassa#9"
      kind="issue"
      number={9}
      title="voorbeeld/kassa#9"
      onOpen={() => {}}
    />,
  )
  render(
    <GitHubLink
      label="Pull request of issue 7"
      text="#7"
      kind="either"
      number={7}
      title="voorbeeld/webwinkel#7"
      onOpen={() => {}}
    />,
  )
  expect(screen.getByRole('button', { name: 'Issue 9' })).toHaveTextContent('kassa#9')
  expect(screen.getByRole('button', { name: 'Pull request of issue 7' })).toBeInTheDocument()
})

test('a click and the keyboard both open it', async () => {
  const onOpen = vi.fn()
  render(
    <GitHubLink
      label="Pull request 1"
      text="#1"
      kind="pull"
      number={1}
      title="voorbeeld/webwinkel#1"
      onOpen={onOpen}
    />,
  )
  const chip = screen.getByRole('button', { name: 'Pull request 1' })
  await userEvent.click(chip)
  chip.focus()
  await userEvent.keyboard('{Enter}')
  expect(onOpen).toHaveBeenCalledTimes(2)
})

test('with an answer of core the chip shows the state and carries the title', () => {
  render(
    <GitHubLink
      label="Pull request 5, samengevoegd"
      text="#5"
      kind="pull"
      number={5}
      title="voorbeeld/kassa#5"
      onOpen={() => {}}
      pull={{ title: 'Kassa sneller', state: 'merged' }}
    />,
  )
  const chip = screen.getByRole('button', { name: 'Pull request 5, samengevoegd' })
  expect(chip).toHaveAttribute('title', 'voorbeeld/kassa#5 · Kassa sneller')
  expect(chip).toHaveAttribute('data-nt-pr-state', 'merged')
})
