import { useState, type FormEvent } from 'react'
import { DISCOS, cleanMeterNumber, isValidMeterNumber } from '../discos'
import { supabase } from '../supabase'
import type { DiscoCode, NewMeter } from '../types'
import { Brand, Footer } from './Brand'
import { GaugeIcon } from './icons'
import { ThemeToggle } from './ThemeToggle'

type Props = {
  defaultMeterNumber: string
  defaultDisco: DiscoCode | ''
  error: string | null
  onCreate: (meter: NewMeter) => Promise<void>
}

// Shown once, when a signed-in account has no meter yet
export function Onboarding({ defaultMeterNumber, defaultDisco, error, onCreate }: Props) {
  const [meterNumber, setMeterNumber] = useState(defaultMeterNumber)
  const [disco, setDisco] = useState<DiscoCode | ''>(defaultDisco)
  const [nickname, setNickname] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isValidMeterNumber(meterNumber)) {
      setFormError('Meter numbers are 11 to 13 digits.')
      return
    }
    if (!disco) {
      setFormError('Choose your electricity company.')
      return
    }
    setFormError('')
    setSaving(true)
    await onCreate({
      meterNumber: cleanMeterNumber(meterNumber),
      disco,
      nickname: nickname.trim() || null,
    })
    setSaving(false)
  }

  const message = formError || error

  return (
    <div className="page landing">
      <div className="topbar container">
        <Brand />
        <div className="topbar-actions">
          <ThemeToggle />
          <button className="ghost" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </div>

      <div className="container narrow">
        <section className="card onboarding">
          <span className="sent-icon">
            <GaugeIcon width={28} height={28} />
          </span>
          <h1>Set up your meter</h1>
          <p className="muted">
            One last step. We use this to label your dashboard. Your entries
            stay private to your account.
          </p>

          <form className="plain-form" onSubmit={handleSubmit}>
            <label>
              Meter number
              <input
                inputMode="numeric"
                required
                placeholder="e.g. 0101 2345 678"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
              />
            </label>
            <label>
              Electricity company (DisCo)
              <select
                required
                value={disco}
                onChange={(e) => setDisco(e.target.value as DiscoCode)}
              >
                <option value="" disabled>
                  Choose your DisCo
                </option>
                {DISCOS.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code} · {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nickname <span className="optional">optional</span>
              <input
                maxLength={40}
                placeholder="e.g. Home, Shop, Flat 2"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </label>
            <button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Start tracking'}
            </button>
            {message && <p className="error">{message}</p>}
          </form>
        </section>
      </div>

      <Footer />
    </div>
  )
}
