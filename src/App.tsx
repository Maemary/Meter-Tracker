import { useState } from 'react'
import { Brand, Footer } from './components/Brand'
import { Modal } from './components/Modal'
import {
  CalendarIcon,
  GaugeIcon,
  TagIcon,
  WalletIcon,
} from './components/icons'
import { ReadingForm } from './components/ReadingForm'
import { RechargeForm } from './components/RechargeForm'
import { ThemeToggle } from './components/ThemeToggle'
import { Tips } from './components/Tips'
import { UsageChart } from './components/UsageChart'
import { discoName, formatMeterNumber } from './discos'
import {
  formatDay,
  formatNaira,
  formatUnits,
  formatWhen,
  greeting,
  nowLocal,
} from './format'
import { supabase } from './supabase'
import type { Meter } from './types'
import { calculateUsage, summarize } from './usage'
import { useMeterData } from './useMeterData'

const MS_PER_DAY = 1000 * 60 * 60 * 24

// Colour for the "days left" card: red when it's urgent
function daysLeftTone(daysLeft: number | undefined) {
  if (daysLeft === undefined) return ''
  if (daysLeft < 3) return 'bad'
  if (daysLeft < 7) return 'warn'
  return 'good'
}

type Props = {
  meter: Meter
  email: string
}

function App({ meter, email }: Props) {
  const {
    readings,
    recharges,
    loading,
    error,
    addReading,
    deleteReading,
    addRecharge,
    deleteRecharge,
  } = useMeterData()

  // Which pop-up form is open, if any
  const [openForm, setOpenForm] = useState<'reading' | 'recharge' | null>(null)
  const closeForm = () => setOpenForm(null)

  const newestFirst = [...readings].sort((a, b) =>
    b.takenAt.localeCompare(a.takenAt),
  )
  const rechargesNewestFirst = [...recharges].sort((a, b) =>
    b.takenAt.localeCompare(a.takenAt),
  )
  const latest = newestFirst[0]

  // Units loaded AFTER the last reading haven't been "seen" on the meter yet,
  // so add them on top: last reading 36 + recharge 88.8 → balance 124.8
  const rechargedSince = latest
    ? recharges
        .filter((rc) => rc.takenAt > latest.takenAt)
        .reduce((total, rc) => total + rc.units, 0)
    : 0
  const balance = latest ? latest.units + rechargedSince : undefined

  const periods = calculateUsage(readings, recharges)
  const summary = summarize(periods, balance)

  const totalPaid = recharges.reduce((total, rc) => total + rc.amount, 0)
  const totalUnitsBought = recharges.reduce((total, rc) => total + rc.units, 0)
  const costPerUnit =
    totalUnitsBought > 0 ? totalPaid / totalUnitsBought : undefined

  // What a unit costs NOW: the price on your most recent recharge
  // (e.g. ₦1,000 for 4.44 units → ₦225). Tariffs change, so the latest
  // price is a better guide than the all-time average.
  const latestRecharge = rechargesNewestFirst[0]
  const latestPrice =
    latestRecharge && latestRecharge.units > 0
      ? latestRecharge.amount / latestRecharge.units
      : costPerUnit

  // Naira per day = units per day × price per unit
  const dailyCost =
    summary.averagePerDay !== undefined && latestPrice !== undefined
      ? summary.averagePerDay * latestPrice
      : undefined

  // Rough date you'll run out: latest reading + days left
  const rechargeBy =
    latest && summary.daysLeft !== undefined
      ? new Date(new Date(latest.takenAt).getTime() + summary.daysLeft * MS_PER_DAY)
      : undefined

  // Spending this calendar month
  const thisMonth = nowLocal().slice(0, 7) // "2026-11"
  const monthRecharges = recharges.filter((rc) => rc.takenAt.startsWith(thisMonth))
  const monthSpend = monthRecharges.reduce((total, rc) => total + rc.amount, 0)
  const monthName = new Date().toLocaleDateString('en-GB', { month: 'long' })

  return (
    <div className="page">
      <header className="hero">
        <div className="container">
          <div className="topbar">
            <Brand />
            <div className="topbar-actions">
              <span className="user-email">{email}</span>
              <ThemeToggle />
              <button className="ghost on-hero" onClick={() => supabase.auth.signOut()}>
                Sign out
              </button>
            </div>
          </div>

          <div className="hero-body">
            <div>
              <p className="hero-kicker">{greeting()}</p>
              <h1>{meter.nickname ?? 'Your meter'}</h1>
              <div className="meter-chip">
                <span className="meter-disco">{meter.disco}</span>
                <span>{discoName(meter.disco)}</span>
                <span className="dot" />
                <span className="meter-number">
                  {formatMeterNumber(meter.meterNumber)}
                </span>
              </div>
              <div className="hero-actions">
                <button className="hero-button primary" onClick={() => setOpenForm('reading')}>
                  <GaugeIcon width={18} height={18} />
                  Log reading
                </button>
                <button className="hero-button" onClick={() => setOpenForm('recharge')}>
                  <WalletIcon width={18} height={18} />
                  Add recharge
                </button>
              </div>
            </div>

            <div className="hero-balance">
              <span>{rechargedSince > 0 ? 'Balance' : 'Last reading'}</span>
              <strong>
                {balance !== undefined ? formatUnits(balance) : '—'}
                <small> units</small>
              </strong>
              <span>
                {!latest
                  ? 'Log your first reading to see your balance'
                  : rechargedSince > 0
                    ? `${formatUnits(latest.units)} at last reading + ${formatUnits(rechargedSince)} recharged`
                    : formatWhen(latest.takenAt)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container dashboard">
        <section className="stats">
          <div className="card stat">
            <span className="stat-icon blue">
              <GaugeIcon />
            </span>
            <span className="stat-label">Average use</span>
            <strong>
              {summary.averagePerDay !== undefined
                ? summary.averagePerDay.toFixed(1)
                : '—'}
            </strong>
            <small>
              {summary.averagePerDay !== undefined
                ? 'units per day'
                : 'needs 2 readings'}
            </small>
          </div>

          <div className={`card stat ${daysLeftTone(summary.daysLeft)}`}>
            <span className="stat-icon green">
              <CalendarIcon />
            </span>
            <span className="stat-label">Days left</span>
            <strong>
              {summary.daysLeft !== undefined ? Math.floor(summary.daysLeft) : '—'}
            </strong>
            <small>
              {rechargeBy ? `recharge by ${formatDay(rechargeBy)}` : 'estimate'}
            </small>
          </div>

          <div className="card stat">
            <span className="stat-icon amber">
              <TagIcon />
            </span>
            <span className="stat-label">Daily cost</span>
            <strong>{dailyCost !== undefined ? formatNaira(dailyCost) : '—'}</strong>
            <small>
              {dailyCost !== undefined && latestPrice !== undefined
                ? `≈ ${formatNaira(dailyCost * 30)}/month · ${formatNaira(latestPrice)}/unit`
                : latestPrice !== undefined
                  ? `${formatNaira(latestPrice)} per unit`
                  : 'needs a recharge + 2 readings'}
            </small>
          </div>

          <div className="card stat">
            <span className="stat-icon violet">
              <WalletIcon />
            </span>
            <span className="stat-label">Spent in {monthName}</span>
            <strong>{formatNaira(monthSpend)}</strong>
            <small>
              {monthRecharges.length} recharge{monthRecharges.length === 1 ? '' : 's'}
            </small>
          </div>
        </section>

        {error && <p className="error">Something went wrong: {error}</p>}
        {loading && <p className="muted loading-line">Loading your entries…</p>}

        <div className="layout">
          <div className="main-col">
            <UsageChart periods={periods} averagePerDay={summary.averagePerDay} />

            <section className="card">
              <div className="card-head">
                <div>
                  <h2>Usage between readings</h2>
                  <p className="muted">Newest first. ⚠ means an entry looks off.</p>
                </div>
              </div>
              {periods.length === 0 ? (
                <p className="empty-line muted">
                  Add at least two readings to see usage.
                </p>
              ) : (
                <ul className="rows">
                  {[...periods].reverse().map((p) => (
                    <li key={p.to}>
                      <span className="muted">
                        {formatWhen(p.from)} → {formatWhen(p.to)}
                      </span>
                      {p.unitsUsed < 0 ? (
                        <strong className="warn-text">⚠ Check entries</strong>
                      ) : (
                        <strong>{p.perDay.toFixed(1)} units/day</strong>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="history">
              <section className="card">
                <div className="card-head">
                  <h2>Readings</h2>
                  <span className="pill">{readings.length}</span>
                </div>
                {newestFirst.length === 0 ? (
                  <p className="empty-line muted">No readings yet.</p>
                ) : (
                  <ul className="rows scroll">
                    {newestFirst.map((r) => (
                      <li key={r.id}>
                        <span className="row-main">
                          <strong>{r.units.toLocaleString()} units</strong>
                          <span className="muted">{formatWhen(r.takenAt)}</span>
                        </span>
                        <button className="danger" onClick={() => deleteReading(r.id)}>
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="card">
                <div className="card-head">
                  <h2>Recharges</h2>
                  <span className="pill">{recharges.length}</span>
                </div>
                {rechargesNewestFirst.length === 0 ? (
                  <p className="empty-line muted">No recharges yet.</p>
                ) : (
                  <ul className="rows scroll">
                    {rechargesNewestFirst.map((r) => (
                      <li key={r.id}>
                        <span className="row-main">
                          <strong>
                            +{r.units.toLocaleString()} units · {formatNaira(r.amount)}
                          </strong>
                          <span className="muted">{formatWhen(r.takenAt)}</span>
                        </span>
                        <button className="danger" onClick={() => deleteRecharge(r.id)}>
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>

          <aside className="side-col">
            <Tips />
          </aside>
        </div>
      </main>

      <Modal open={openForm === 'reading'} onClose={closeForm} label="Log a reading">
        <ReadingForm onAdd={addReading} onDone={closeForm} />
      </Modal>
      <Modal open={openForm === 'recharge'} onClose={closeForm} label="Record a recharge">
        <RechargeForm onAdd={addRecharge} onDone={closeForm} pricePerUnit={latestPrice} />
      </Modal>

      <Footer />
    </div>
  )
}

export default App
