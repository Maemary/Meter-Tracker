// A meter balance you checked
export type Reading = {
  id: string
  takenAt: string // when you checked, e.g. "2026-11-09T08:30"
  units: number   // units left on the meter (kWh)
}

// Units you bought
export type Recharge = {
  id: string
  takenAt: string // when you loaded the token
  units: number   // units added (kWh)
  amount: number  // naira paid
}

export type NewReading = Omit<Reading, 'id'>
export type NewRecharge = Omit<Recharge, 'id'>

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

// The meter an account tracks
export type Meter = {
  id: string
  meterNumber: string
  disco: DiscoCode
  nickname: string | null
}

export type NewMeter = Omit<Meter, 'id'>
