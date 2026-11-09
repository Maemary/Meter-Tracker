import type { DiscoCode } from './types'

export const DISCOS: { code: DiscoCode; name: string; area: string }[] = [
  { code: 'IKEDC', name: 'Ikeja Electric', area: 'Lagos (north)' },
  { code: 'EKEDC', name: 'Eko Electricity', area: 'Lagos (south)' },
  { code: 'IBEDC', name: 'Ibadan Electricity', area: 'Oyo, Ogun, Osun, Kwara' },
  { code: 'AEDC', name: 'Abuja Electricity', area: 'FCT, Kogi, Niger, Nasarawa' },
  { code: 'BEDC', name: 'Benin Electricity', area: 'Edo, Delta, Ondo, Ekiti' },
  { code: 'EEDC', name: 'Enugu Electricity', area: 'South-East' },
  { code: 'PHED', name: 'Port Harcourt Electricity', area: 'Rivers, Bayelsa, Cross River, Akwa Ibom' },
  { code: 'JED', name: 'Jos Electricity', area: 'Plateau, Bauchi, Benue, Gombe' },
  { code: 'KAEDCO', name: 'Kaduna Electric', area: 'Kaduna, Kebbi, Sokoto, Zamfara' },
  { code: 'KEDCO', name: 'Kano Electricity', area: 'Kano, Jigawa, Katsina' },
  { code: 'YEDC', name: 'Yola Electricity', area: 'Adamawa, Borno, Taraba, Yobe' },
  { code: 'ABA', name: 'Aba Power', area: 'Aba ring-fenced area' },
]

export function discoName(code: DiscoCode) {
  return DISCOS.find((d) => d.code === code)?.name ?? code
}

// Strip spaces/dashes people type: "0101 2345-678" → "01012345678"
export function cleanMeterNumber(input: string) {
  return input.replace(/[\s-]/g, '')
}

export function isValidMeterNumber(input: string) {
  return /^[0-9]{11,13}$/.test(cleanMeterNumber(input))
}

// Invite codes: "k7qm 4xpa" / "K7QM-4XPA" → "K7QM4XPA"
export function cleanInviteCode(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function isValidInviteCode(input: string) {
  return cleanInviteCode(input).length === 8
}

// "K7QM4XPA" → "K7QM-4XPA"
export function formatInviteCode(code: string) {
  return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code
}

// "01012345678" → "0101 2345 678" (easier to read)
export function formatMeterNumber(meterNumber: string) {
  return meterNumber.replace(/(\d{4})(?=\d)/g, '$1 ')
}
