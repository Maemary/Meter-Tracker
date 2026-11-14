import { useState, type FormEvent } from 'react'
import { formatNaira, nowLocal } from '../format'
import type { NewRecharge } from '../types'

type Props = {
  // Resolves true when saved, false if it failed
  onAdd: (recharge: NewRecharge) => Promise<boolean>
  onDone: () => void
  // Price of one unit on the last recharge (₦1,000 ÷ 4.44 units ≈ ₦225).
  // Used to fill in the units for you. Undefined until the first recharge.
  pricePerUnit: number | undefined
}

export function RechargeForm({ onAdd, onDone, pricePerUnit }: Props) {
  const [takenAt, setTakenAt] = useState(nowLocal)
  const [units, setUnits] = useState('')
  const [amount, setAmount] = useState('')
  // Once you type the units yourself, we stop overwriting them
  const [unitsTypedByHand, setUnitsTypedByHand] = useState(false)
  const [saving, setSaving] = useState(false)
  const [problem, setProblem] = useState('')

  function handleAmountChange(value: string) {
    setAmount(value)
    if (unitsTypedByHand || pricePerUnit === undefined) return

    const naira = Number(value)
    setUnits(value === '' || naira <= 0 ? '' : (naira / pricePerUnit).toFixed(2))
  }

  function handleUnitsChange(value: string) {
    setUnits(value)
    setUnitsTypedByHand(value !== '')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!takenAt || units === '' || amount === '') return
    if (takenAt > nowLocal()) {
      setProblem('That time is in the future. Check the AM/PM part.')
      return
    }

    setSaving(true)
    const saved = await onAdd({ takenAt, units: Number(units), amount: Number(amount) })
    setSaving(false)

    if (saved) onDone()
    else setProblem("Couldn't save. Check your connection and try again.")
  }

  const autoFilled = !unitsTypedByHand && units !== '' && pricePerUnit !== undefined

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-head">
        <h2>Record a recharge</h2>
        <p className="muted">Units and price are on your token receipt.</p>
      </div>
      <label>
        When did you load the token?
        <input
          type="datetime-local"
          max={nowLocal()}
          value={takenAt}
          onChange={(e) => setTakenAt(e.target.value)}
        />
      </label>
      <div className="field-row">
        <label>
          Amount paid (₦)
          <input
            data-autofocus
            type="number"
            step="1"
            min="0"
            inputMode="numeric"
            placeholder="e.g. 20000"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
          />
        </label>
        <label>
          Units added
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="e.g. 88.8"
            value={units}
            onChange={(e) => handleUnitsChange(e.target.value)}
          />
        </label>
      </div>
      {autoFilled && (
        <p className="hint">
          Units filled in at {formatNaira(pricePerUnit)}/unit (your last
          recharge). Change it if your receipt says otherwise.
        </p>
      )}
      <button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save recharge'}
      </button>
      {problem && <p className="error">{problem}</p>}
    </form>
  )
}
