import { useState, type FormEvent } from 'react'
import { nowLocal } from '../format'
import type { NewReading } from '../types'

type Props = {
  onAdd: (reading: NewReading) => void
}

export function ReadingForm({ onAdd }: Props) {
  const [takenAt, setTakenAt] = useState(nowLocal)
  const [units, setUnits] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!takenAt || units === '') return

    onAdd({ takenAt, units: Number(units) })
    setUnits('')
    setTakenAt(nowLocal())
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-head">
        <h2>Log a reading</h2>
        <p className="muted">Check the units left on your meter.</p>
      </div>
      <label>
        When did you check?
        <input
          type="datetime-local"
          value={takenAt}
          onChange={(e) => setTakenAt(e.target.value)}
        />
      </label>
      <label>
        Units left on the meter
        <input
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          placeholder="e.g. 84.5"
          value={units}
          onChange={(e) => setUnits(e.target.value)}
        />
      </label>
      <button type="submit">Save reading</button>
    </form>
  )
}
