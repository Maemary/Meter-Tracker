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

// 124.80000001 → "124.8", 1500 → "1,500"
export function formatUnits(units: number) {
  return units.toLocaleString('en-NG', { maximumFractionDigits: 2 })
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

// Best guess at a first name from an email address:
//   "tunde.bakare@gmail.com" → "Tunde", "ngozi_eze22@yahoo.com" → "Ngozi"
//   "aishatoduye1@gmail.com" → null (names run together; can't split safely)
export function nameFromEmail(email: string) {
  const local = email.split('@')[0] ?? ''
  const pieces = local.split(/[._\-+0-9]+/).filter(Boolean)
  const first = pieces[0]
  if (!first || first.length < 2) return null
  // One long joined-up word is probably first+last name stuck together
  if (pieces.length === 1 && first.length > 9) return null
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

// What to call a household member: their chosen name, a guess from their
// email, or the start of their email as a last resort
export function memberName(member: { displayName: string | null; email: string }) {
  return member.displayName || nameFromEmail(member.email) || member.email.split('@')[0]
}

// "Good morning" / "Good afternoon" / "Good evening"
export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
