import { useState, type FormEvent } from 'react'
import { nowLocal } from '../format'
import type { NewReading } from '../types'

type Props = {
  // Resolves true when saved, false if it failed
  onAdd: (reading: NewReading) => Promise<boolean>
  onDone: () => void
}

export function ReadingForm({ onAdd, onDone }: Props) {
  const [takenAt, setTakenAt] = useState(nowLocal)
  const [units, setUnits] = useState('')
  const [saving, setSaving] = useState(false)
  const [problem, setProblem] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!takenAt || units === '') return
    // A future time is almost always an AM/PM slip, and it would put this
    // reading in the wrong order with your recharges
    if (takenAt > nowLocal()) {
      setProblem('That time is in the future. Check the AM/PM part.')
      return
    }

    setSaving(true)
    const saved = await onAdd({ takenAt, units: Number(units) })
    setSaving(false)

    if (saved) onDone()
    else setProblem("Couldn't save. Check your connection and try again.")
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
          max={nowLocal()}
          value={takenAt}
          onChange={(e) => setTakenAt(e.target.value)}
        />
      </label>
      <label>
        Units left on the meter
        <input
          data-autofocus
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          placeholder="e.g. 84.5"
          value={units}
          onChange={(e) => setUnits(e.target.value)}
        />
      </label>
      <button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save reading'}
      </button>
      {problem && <p className="error">{problem}</p>}
    </form>
  )
}
