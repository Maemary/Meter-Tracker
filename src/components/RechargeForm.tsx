import { useState, type FormEvent } from 'react'
import { formatNaira, nowLocal } from '../format'
import type { NewRecharge } from '../types'

type Props = {
  onAdd: (recharge: NewRecharge) => void
  // Price of one unit on the last recharge (₦1,000 ÷ 4.44 units ≈ ₦225).
  // Used to fill in the units for you. Undefined until the first recharge.
  pricePerUnit: number | undefined
}

export function RechargeForm({ onAdd, pricePerUnit }: Props) {
  const [takenAt, setTakenAt] = useState(nowLocal)
  const [units, setUnits] = useState('')
  const [amount, setAmount] = useState('')
  // Once you type the units yourself, we stop overwriting them
  const [unitsTypedByHand, setUnitsTypedByHand] = useState(false)

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!takenAt || units === '' || amount === '') return

    onAdd({ takenAt, units: Number(units), amount: Number(amount) })
    setUnits('')
    setAmount('')
    setUnitsTypedByHand(false)
    setTakenAt(nowLocal())
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
          value={takenAt}
          onChange={(e) => setTakenAt(e.target.value)}
        />
      </label>
      <div className="field-row">
        <label>
          Amount paid (₦)
          <input
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
      <button type="submit">Save recharge</button>
    </form>
  )
}
