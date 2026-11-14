import type { Reading, Recharge } from './types'

export type UsagePeriod = {
  from: string
  to: string
  // The working, so the dashboard can show exactly how it got the answer:
  //   startUnits + recharged − endUnits = unitsUsed, ÷ days = perDay
  startUnits: number
  recharged: number
  endUnits: number
  days: number
  unitsUsed: number
  perDay: number
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

// Which entry happened first? Compare the time you picked; if two entries
// have the SAME time (both forms fill in "now" to the minute), whichever you
// saved first counts as first. So "read the meter, then recharge" stays in
// that order even when both say 09:30.
export function compareEntries(
  a: { takenAt: string; savedAt: string },
  b: { takenAt: string; savedAt: string },
) {
  return a.takenAt.localeCompare(b.takenAt) || a.savedAt.localeCompare(b.savedAt)
}

export function calculateUsage(
  readings: Reading[],
  recharges: Recharge[],
): UsagePeriod[] {
  const oldestFirst = [...readings].sort(compareEntries)
  const periods: UsagePeriod[] = []

  for (let i = 1; i < oldestFirst.length; i++) {
    const start = oldestFirst[i - 1]
    const end = oldestFirst[i]

    // Recharges strictly between the two readings: after the earlier one,
    // before the later one (a recharge never counts in two periods)
    const recharged = recharges
      .filter((rc) => compareEntries(rc, start) > 0 && compareEntries(rc, end) < 0)
      .reduce((total, rc) => total + rc.units, 0)

    const unitsUsed = start.units + recharged - end.units
    const days =
      (new Date(end.takenAt).getTime() - new Date(start.takenAt).getTime()) /
      MS_PER_DAY

    if (days <= 0) continue // same time: can't divide by zero days

    periods.push({
      from: start.takenAt,
      to: end.takenAt,
      startUnits: start.units,
      recharged,
      endUnits: end.units,
      days,
      unitsUsed,
      perDay: unitsUsed / days,
    })
  }

  return periods
}

// Units recharged after the latest reading haven't shown up in any reading
// yet, so add them on top: last reading 30 + recharge 133 = balance 163
export function currentBalance(readings: Reading[], recharges: Recharge[]) {
  const latest = [...readings].sort(compareEntries).at(-1)
  if (!latest) return { latest: undefined, rechargedSince: 0, balance: undefined }

  const rechargedSince = recharges
    .filter((rc) => compareEntries(rc, latest) > 0)
    .reduce((total, rc) => total + rc.units, 0)

  return { latest, rechargedSince, balance: latest.units + rechargedSince }
}

export function summarize(periods: UsagePeriod[], latestBalance?: number) {
  // Periods with negative usage are data mistakes (flagged on the dashboard)
  // and are left out so they can't drag the average around
  const valid = periods.filter((p) => p.unitsUsed >= 0)
  const totalUsed = valid.reduce((total, p) => total + p.unitsUsed, 0)
  const totalDays = valid.reduce((total, p) => total + p.days, 0)
  const averagePerDay = totalDays > 0 ? totalUsed / totalDays : undefined
  const daysLeft =
    averagePerDay && latestBalance !== undefined
      ? latestBalance / averagePerDay
      : undefined

  return { totalUsed, totalDays, averagePerDay, daysLeft }
}
