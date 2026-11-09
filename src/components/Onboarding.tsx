import { useState, type FormEvent } from 'react'
import {
  DISCOS,
  cleanInviteCode,
  cleanMeterNumber,
  isValidInviteCode,
  isValidMeterNumber,
} from '../discos'
import { supabase } from '../supabase'
import type { DiscoCode, NewMeter } from '../types'
import { Brand, Footer } from './Brand'
import { GaugeIcon } from './icons'
import { ThemeToggle } from './ThemeToggle'

type Props = {
  defaultMeterNumber: string
  defaultDisco: DiscoCode | ''
  defaultInviteCode: string
  error: string | null
  onCreate: (meter: NewMeter) => Promise<void>
  onJoin: (code: string, meterNumber: string) => Promise<void>
}

type Choice = 'create' | 'join'

// Shown when a signed-in account has no meter yet: set one up, or join a
// family member's with their invite code.
export function Onboarding({
  defaultMeterNumber,
  defaultDisco,
  defaultInviteCode,
  error,
  onCreate,
  onJoin,
}: Props) {
  const [choice, setChoice] = useState<Choice>(defaultInviteCode ? 'join' : 'create')
  const [meterNumber, setMeterNumber] = useState(defaultMeterNumber)
  const [disco, setDisco] = useState<DiscoCode | ''>(defaultDisco)
  const [nickname, setNickname] = useState('')
  const [inviteCode, setInviteCode] = useState(defaultInviteCode)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isValidMeterNumber(meterNumber)) {
      setFormError('Meter numbers are 11 to 13 digits.')
      return
    }
    if (choice === 'join' && !isValidInviteCode(inviteCode)) {
      setFormError('Invite codes have 8 letters and numbers, like K7QM-4XPA.')
      return
    }
    if (choice === 'create' && !disco) {
      setFormError('Choose your electricity company.')
      return
    }
    setFormError('')
    setSaving(true)
    if (choice === 'join') {
      await onJoin(cleanInviteCode(inviteCode), cleanMeterNumber(meterNumber))
    } else if (disco) {
      await onCreate({
        meterNumber: cleanMeterNumber(meterNumber),
        disco,
        nickname: nickname.trim() || null,
      })
    }
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
          <h1>{choice === 'join' ? 'Join a household' : 'Set up your meter'}</h1>
          <p className="muted">
            {choice === 'join'
              ? 'Ask the person who set up your meter for the invite code on their dashboard.'
              : 'One last step. We use this to label your dashboard.'}
          </p>

          <div className="tabs" role="tablist">
            <button
              role="tab"
              aria-selected={choice === 'create'}
              className={choice === 'create' ? 'active' : ''}
              onClick={() => setChoice('create')}
            >
              New meter
            </button>
            <button
              role="tab"
              aria-selected={choice === 'join'}
              className={choice === 'join' ? 'active' : ''}
              onClick={() => setChoice('join')}
            >
              Join with code
            </button>
          </div>

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

            {choice === 'join' ? (
              <label>
                Invite code
                <input
                  required
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={9}
                  placeholder="e.g. K7QM-4XPA"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                />
              </label>
            ) : (
              <>
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
              </>
            )}

            <button type="submit" disabled={saving}>
              {saving
                ? choice === 'join'
                  ? 'Joining…'
                  : 'Saving…'
                : choice === 'join'
                  ? 'Join household'
                  : 'Start tracking'}
            </button>
            {message && <p className="error">{message}</p>}
          </form>
        </section>
      </div>

      <Footer />
    </div>
  )
}
