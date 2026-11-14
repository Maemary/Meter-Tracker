// A meter balance you checked
export type Reading = {
  id: string
  takenAt: string // when you checked, e.g. "2026-11-09T08:30"
  units: number   // units left on the meter (kWh)
  createdBy: string | null // which household member logged it
  savedAt: string // exact moment it was saved; breaks ties between equal takenAt times
}

// Units you bought
export type Recharge = {
  id: string
  takenAt: string // when you loaded the token
  units: number   // units added (kWh)
  amount: number  // naira paid
  createdBy: string | null
  savedAt: string
}

export type NewReading = Omit<Reading, 'id' | 'createdBy' | 'savedAt'>
export type NewRecharge = Omit<Recharge, 'id' | 'createdBy' | 'savedAt'>

// Someone who shares the meter
export type Member = {
  userId: string
  displayName: string | null
  email: string
  role: 'owner' | 'member'
}

// Electricity distribution companies (codes match the database check)
export type DiscoCode =
  | 'ABA'
  | 'AEDC'
  | 'BEDC'
  | 'EEDC'
  | 'EKEDC'
  | 'IBEDC'
  | 'IKEDC'
  | 'JED'
  | 'KAEDCO'
  | 'KEDCO'
  | 'PHED'
  | 'YEDC'

// The meter an account tracks (alone, or shared with a household)
export type Meter = {
  id: string
  meterNumber: string
  disco: DiscoCode
  nickname: string | null
  inviteCode: string // 8 characters, shown as "K7QM-4XPA"
  isOwner: boolean // did I create it?
}

export type NewMeter = Omit<Meter, 'id' | 'inviteCode' | 'isOwner'>

// What was typed on the sign-up form (saved on the account)
export type SignUpDetails = {
  meterNumber: string
  disco: DiscoCode | null // set when creating a new meter
  inviteCode: string | null // set when joining someone else's
}
