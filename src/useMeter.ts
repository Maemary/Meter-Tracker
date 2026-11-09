import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { DiscoCode, Meter, NewMeter } from './types'

type MeterRow = {
  id: string
  meter_number: string
  disco: DiscoCode
  nickname: string | null
}

function toMeter(row: MeterRow): Meter {
  return {
    id: row.id,
    meterNumber: row.meter_number,
    disco: row.disco,
    nickname: row.nickname,
  }
}

// Loads the signed-in account's meter. If there isn't one yet but the
// sign-up form gave us the details (`fromSignUp`), creates it straight away.
export function useMeter(userId: string, fromSignUp: NewMeter | null) {
  const [meter, setMeter] = useState<Meter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('meters')
        .select('id, meter_number, disco, nickname')
        .eq('owner_id', userId)
        .maybeSingle()

      if (error) {
        setError(error.message)
      } else if (data) {
        setMeter(toMeter(data))
      } else if (fromSignUp) {
        // Brand-new account: save the meter they typed when signing up
        const created = await supabase
          .from('meters')
          .insert({
            meter_number: fromSignUp.meterNumber,
            disco: fromSignUp.disco,
            nickname: fromSignUp.nickname,
          })
          .select('id, meter_number, disco, nickname')
          .single()
        if (created.error) setError(created.error.message)
        else setMeter(toMeter(created.data))
      }
      setLoading(false)
    }

    load()
    // fromSignUp only matters on the first load, so it's not a dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function createMeter(input: NewMeter) {
    setError(null)
    const { data, error } = await supabase
      .from('meters')
      .insert({
        meter_number: input.meterNumber,
        disco: input.disco,
        nickname: input.nickname,
      })
      .select('id, meter_number, disco, nickname')
      .single()

    if (error) {
      setError(error.message)
      return
    }
    setMeter(toMeter(data))
  }

  return { meter, loading, error, createMeter }
}
