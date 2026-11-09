import { useState, type FormEvent } from 'react'
import gaugeImage from '../assets/gauge.avif'
import {
  DISCOS,
  cleanInviteCode,
  cleanMeterNumber,
  isValidInviteCode,
  isValidMeterNumber,
} from '../discos'
import { supabase } from '../supabase'
import type { DiscoCode } from '../types'
import { Brand, Footer } from './Brand'
import { ChartIcon, GaugeIcon, ShieldIcon, WalletIcon } from './icons'
import { ThemeToggle } from './ThemeToggle'

type Mode = 'signup' | 'signin'

const FEATURES = [
  {
    icon: GaugeIcon,
    title: 'See your real daily usage',
    text: 'Log the units on your meter and we work out how many you burn each day, recharges included.',
  },
  {
    icon: ChartIcon,
    title: 'Spot sudden drains',
    text: 'A chart of every period makes spikes from faulty meters, wiring or heavy appliances obvious.',
  },
  {
    icon: WalletIcon,
    title: 'Know what it costs you',
    text: 'Your daily spend in naira, days left before you run out, and your true price per unit.',
  },
]

// Turn Supabase's technical messages into plain ones
function friendlyError(message: string, mode: Mode) {
  const text = message.toLowerCase()
  if (text.includes('invalid login credentials')) {
    return "That email and meter number don't match an account."
  }
  if (text.includes('already registered')) {
    return 'An account with this email already exists. Switch to "Log in".'
  }
  if (text.includes('signups not allowed') || text.includes('signup is disabled')) {
    return mode === 'signup'
      ? 'New accounts are switched off at the moment.'
      : "That email and meter number don't match an account."
  }
  return message
}

export function SignIn() {
  const [mode, setMode] = useState<Mode>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [meterNumber, setMeterNumber] = useState('')
  const [showMeter, setShowMeter] = useState(false)
  const [disco, setDisco] = useState<DiscoCode | ''>('')
  // Joining a family member's meter instead of setting up a new one?
  const [joining, setJoining] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    if (!isValidMeterNumber(meterNumber)) {
      setErrorMessage('Meter numbers are 11 to 13 digits. Check the front of your meter or a token receipt.')
      return
    }
    if (mode === 'signup' && joining && !isValidInviteCode(inviteCode)) {
      setErrorMessage('Invite codes have 8 letters and numbers, like K7QM-4XPA.')
      return
    }
    if (mode === 'signup' && !joining && !disco) {
      setErrorMessage('Choose your electricity company.')
      return
    }

    const meter = cleanMeterNumber(meterNumber)
    setBusy(true)

    // The meter number acts as the account's password, so logging in is
    // just "email + meter number". (Supabase stores it scrambled.)
    const { error } =
      mode === 'signup'
        ? await supabase.auth.signUp({
            email,
            password: meter,
            options: {
              data: {
                meter_number: meter,
                display_name: name.trim() || null,
                // one or the other: join an existing meter, or create one
                ...(joining
                  ? { invite_code: cleanInviteCode(inviteCode) }
                  : { disco }),
              },
            },
          })
        : await supabase.auth.signInWithPassword({ email, password: meter })

    setBusy(false)
    if (error) setErrorMessage(friendlyError(error.message, mode))
    // On success, useSession notices the new session and Root shows the app
  }

  function switchMode(next: Mode) {
    setMode(next)
    setErrorMessage('')
  }

  return (
    <div className="page landing">
      <div
        className="landing-art"
        aria-hidden="true"
        style={{ backgroundImage: `url(${gaugeImage})` }}
      />
      <div className="topbar container">
        <Brand />
        <ThemeToggle />
      </div>

      <div className="container landing-grid">
        <section className="landing-copy">
          <span className="eyebrow">For prepaid meters across Nigeria</span>
          <h1>Know exactly where your units go.</h1>
          <p className="lead">
            Units vanishing faster than they should? Track your meter in
            seconds a day and get the numbers to prove it.
          </p>

          <ul className="features">
            {FEATURES.map(({ icon: FeatureIcon, title, text }) => (
              <li key={title}>
                <span className="feature-icon">
                  <FeatureIcon />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="disco-strip">
            <span>Works with</span>
            {DISCOS.slice(0, 8).map((d) => (
              <span key={d.code} className="chip">
                {d.code}
              </span>
            ))}
            <span className="chip">+{DISCOS.length - 8} more</span>
          </div>
        </section>

        <section className="auth-card card">
          <div className="tabs" role="tablist">
            <button
              role="tab"
              aria-selected={mode === 'signup'}
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => switchMode('signup')}
            >
              Create account
            </button>
            <button
              role="tab"
              aria-selected={mode === 'signin'}
              className={mode === 'signin' ? 'active' : ''}
              onClick={() => switchMode('signin')}
            >
              Log in
            </button>
          </div>

          <form className="plain-form" method="post" onSubmit={handleSubmit}>
            {/* Browsers offer to save a login when they see a "username"
                field next to a type="password" field, so the meter number
                is a password field (with a show/hide button). */}
            {mode === 'signup' && (
              <label>
                <span>
                  What should we call you? <span className="optional">optional</span>
                </span>
                <input
                  name="nickname"
                  autoComplete="given-name"
                  maxLength={30}
                  placeholder="e.g. Aisha"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                name="username"
                required
                autoComplete="username"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            {/* The Show button sits OUTSIDE the <label> (browsers handle
                buttons inside labels inconsistently), linked by htmlFor/id. */}
            <div className="field">
              <label htmlFor="meter-number">Meter number</label>
              <div className="password-field">
                <input
                  id="meter-number"
                  type={showMeter ? 'text' : 'password'}
                  name="password"
                  inputMode="numeric"
                  required
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder="e.g. 0101 2345 678"
                  value={meterNumber}
                  onChange={(e) => setMeterNumber(e.target.value)}
                />
                <button
                  type="button"
                  className="reveal"
                  // Keep focus in the field: on phones, losing focus closes
                  // the keyboard and the page jumps before the tap lands.
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => setShowMeter((shown) => !shown)}
                  aria-label={showMeter ? 'Hide meter number' : 'Show meter number'}
                  aria-pressed={showMeter}
                >
                  {showMeter ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {mode === 'signup' && !joining && (
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
            )}

            {mode === 'signup' && joining && (
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
            )}

            {mode === 'signup' && (
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setJoining((j) => !j)
                  setErrorMessage('')
                }}
              >
                {joining
                  ? 'Setting up a new meter instead?'
                  : 'Someone at home already uses Meter Tracker? Join with their invite code'}
              </button>
            )}

            <button type="submit" disabled={busy}>
              {busy
                ? mode === 'signup'
                  ? 'Creating account…'
                  : 'Logging in…'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Log in'}
            </button>

            {errorMessage && <p className="error">{errorMessage}</p>}
          </form>

          <p className="fine-print">
            <ShieldIcon width={16} height={16} />
            {mode === 'signup' && joining
              ? 'Use the same meter number as the person who invited you. Next time, log in with your email and that meter number.'
              : mode === 'signup'
                ? 'Next time, just log in with your email and meter number.'
                : 'Use the email and meter number you signed up with.'}
          </p>
        </section>
      </div>

      <Footer />
    </div>
  )
}
