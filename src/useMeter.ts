import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { DiscoCode, Meter, NewMeter, SignUpDetails } from './types'

type MeterRow = {
  id: string
  meter_number: string
  disco: DiscoCode
  nickname: string | null
  invite_code: string
  owner_id: string
}

const COLUMNS = 'id, meter_number, disco, nickname, invite_code, owner_id'

function toMeter(row: MeterRow, userId: string): Meter {
  return {
    id: row.id,
    meterNumber: row.meter_number,
    disco: row.disco,
    nickname: row.nickname,
    inviteCode: row.invite_code,
    isOwner: row.owner_id === userId,
  }
}

// The meter this account belongs to (its own, or a household it joined).
// On a brand-new account it also finishes sign-up: joins with the invite
// code, or creates the meter typed on the form.
export function useMeter(userId: string, fromSignUp: SignUpDetails | null) {
  const [meter, setMeter] = useState<Meter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Row-level security only returns the meter we're a member of
  async function fetchMeter() {
    const { data, error } = await supabase.from('meters').select(COLUMNS).maybeSingle()
    if (error) {
      setError(error.message)
      return null
    }
    const found = data ? toMeter(data, userId) : null
    setMeter(found)
    return found
  }

  async function joinMeter(code: string, meterNumber: string) {
    setError(null)
    const { error } = await supabase.rpc('join_meter', {
      p_code: code,
      p_meter_number: meterNumber,
    })
    if (error) {
      setError(error.message)
      return
    }
    await fetchMeter()
  }

  async function createMeter(input: NewMeter) {
    setError(null)
    const { data, error } = await supabase
      .from('meters')
      .insert({
        meter_number: input.meterNumber,
        disco: input.disco,
        nickname: input.nickname,
      })
      .select(COLUMNS)
      .single()

    if (error) {
      setError(error.message)
      return
    }
    setMeter(toMeter(data, userId))
  }

  async function leaveHousehold() {
    const { error } = await supabase.rpc('leave_household')
    if (error) {
      setError(error.message)
      return
    }
    setMeter(null) // back to the setup screen: create or join another
  }

  useEffect(() => {
    async function load() {
      const found = await fetchMeter()
      if (!found && fromSignUp) {
        if (fromSignUp.inviteCode) {
          await joinMeter(fromSignUp.inviteCode, fromSignUp.meterNumber)
        } else if (fromSignUp.disco) {
          await createMeter({
            meterNumber: fromSignUp.meterNumber,
            disco: fromSignUp.disco,
            nickname: null,
          })
        }
      }
      setLoading(false)
    }

    load()
    // Runs once per account; fromSignUp only matters the first time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return { meter, loading, error, createMeter, joinMeter, leaveHousehold }
}
