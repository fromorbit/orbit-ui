import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { FormField } from './FormField'
import { Slider } from './Slider'

function Memory({ onChange }: { onChange(value: number): void }) {
  const [value, setValue] = useState(512)
  return (
    <Slider
      label="Geheugen"
      value={value}
      min={128}
      max={4096}
      step={128}
      valueText={(v) => `${v} MB`}
      onValueChange={(next) => {
        setValue(next)
        onChange(next)
      }}
    />
  )
}

test('the thumb is a slider with its range and the value in words', () => {
  render(<Memory onChange={vi.fn()} />)
  const thumb = screen.getByRole('slider', { name: 'Geheugen' })
  expect(thumb).toHaveAttribute('aria-valuenow', '512')
  expect(thumb).toHaveAttribute('aria-valuemin', '128')
  expect(thumb).toHaveAttribute('aria-valuemax', '4096')
  expect(thumb).toHaveAttribute('aria-valuetext', '512 MB')
})

test('the arrows move one step, Home and End to the ends', async () => {
  const onChange = vi.fn()
  render(<Memory onChange={onChange} />)
  const thumb = screen.getByRole('slider', { name: 'Geheugen' })
  thumb.focus()
  await userEvent.keyboard('{ArrowRight}')
  expect(onChange).toHaveBeenLastCalledWith(640)
  await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
  expect(onChange).toHaveBeenLastCalledWith(384)
  await userEvent.keyboard('{End}')
  expect(onChange).toHaveBeenLastCalledWith(4096)
  await userEvent.keyboard('{Home}')
  expect(onChange).toHaveBeenLastCalledWith(128)
  expect(thumb).toHaveAttribute('aria-valuetext', '128 MB')
})

test('the figure beside the track is hidden from a screen reader, which hears valuetext', () => {
  render(<Memory onChange={vi.fn()} />)
  expect(screen.getByText('512 MB')).toHaveAttribute('aria-hidden', 'true')
})

test('a disabled slider does not move', async () => {
  const onValueChange = vi.fn()
  render(
    <Slider
      label="CPU"
      value={2}
      max={8}
      disabled
      valueText={String}
      onValueChange={onValueChange}
    />,
  )
  const thumb = screen.getByRole('slider', { name: 'CPU' })
  thumb.focus()
  await userEvent.keyboard('{ArrowRight}')
  expect(onValueChange).not.toHaveBeenCalled()
})

test('FormField names and describes the thumb', () => {
  render(
    <FormField label="Replica's" description="Hoeveel kopieën er draaien.">
      {(field) => (
        <Slider
          label="x"
          value={2}
          max={10}
          valueText={String}
          onValueChange={vi.fn()}
          {...field}
        />
      )}
    </FormField>,
  )
  expect(screen.getByRole('slider', { name: "Replica's" })).toHaveAccessibleDescription(
    'Hoeveel kopieën er draaien.',
  )
})
