// "2026-11-09T08:30" → "Mon 9 Nov, 08:30"
export function formatWhen(takenAt: string) {
  return new Date(takenAt).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// "2026-11-09T08:30" → "9 Nov"
export function formatDay(takenAt: string | Date) {
  return new Date(takenAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

// 20000 → "₦20,000"
export function formatNaira(amount: number) {
  return `₦${Math.round(amount).toLocaleString('en-NG')}`
}

// Current local time in the format a datetime-local input expects
export function nowLocal() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

// "Good morning" / "Good afternoon" / "Good evening"
export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
