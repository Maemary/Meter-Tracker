import type { Reading, Recharge } from './types'

export type UsagePeriod = {
  from: string
  to: string
  days: number
  unitsUsed: number
  perDay: number
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

export function calculateUsage(
  readings: Reading[],
  recharges: Recharge[],
): UsagePeriod[] {
  const oldestFirst = [...readings].sort((a, b) =>
    a.takenAt.localeCompare(b.takenAt),
  )
  const periods: UsagePeriod[] = []

  for (let i = 1; i < oldestFirst.length; i++) {
    const start = oldestFirst[i - 1]
    const end = oldestFirst[i]

    const rechargedUnits = recharges
      .filter((rc) => rc.takenAt > start.takenAt && rc.takenAt <= end.takenAt)
      .reduce((total, rc) => total + rc.units, 0)

    const unitsUsed = start.units + rechargedUnits - end.units
    const days =
      (new Date(end.takenAt).getTime() - new Date(start.takenAt).getTime()) /
      MS_PER_DAY

    if (days <= 0) continue

    periods.push({
      from: start.takenAt,
      to: end.takenAt,
      days,
      unitsUsed,
      perDay: unitsUsed / days,
    })
  }

  return periods
}

export function summarize(periods: UsagePeriod[], latestBalance?: number) {
  const totalUsed = periods.reduce((total, p) => total + p.unitsUsed, 0)
  const totalDays = periods.reduce((total, p) => total + p.days, 0)
  const averagePerDay = totalDays > 0 ? totalUsed / totalDays : undefined
  const daysLeft =
    averagePerDay && latestBalance !== undefined
      ? latestBalance / averagePerDay
      : undefined

  return { totalUsed, totalDays, averagePerDay, daysLeft }
}