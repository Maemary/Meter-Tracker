import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { NewReading, NewRecharge, Reading, Recharge } from './types'

// What a row looks like in the database (snake_case)
type ReadingRow = {
  id: string
  taken_at: string
  units: number
  created_by: string | null
}
type RechargeRow = ReadingRow & { amount: number }

// Database row → app object (camelCase)
function toReading(row: ReadingRow): Reading {
  return {
    id: row.id,
    takenAt: row.taken_at.slice(0, 16),
    units: Number(row.units),
    createdBy: row.created_by,
  }
}

function toRecharge(row: RechargeRow): Recharge {
  return { ...toReading(row), amount: Number(row.amount) }
}

export function useMeterData() {
  const [readings, setReadings] = useState<Reading[]>([])
  const [recharges, setRecharges] = useState<Recharge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [readingsResult, rechargesResult] = await Promise.all([
        supabase.from('readings').select('id, taken_at, units, created_by'),
        supabase.from('recharges').select('id, taken_at, units, amount, created_by'),
      ])

      const loadError = readingsResult.error ?? rechargesResult.error
      if (loadError) {
        setError(loadError.message)
      } else {
        setReadings((readingsResult.data ?? []).map(toReading))
        setRecharges((rechargesResult.data ?? []).map(toRecharge))
      }
      setLoading(false)
    }

    load()
  }, [])

  async function addReading(reading: NewReading) {
    const { data, error } = await supabase
      .from('readings')
      .insert({ taken_at: reading.takenAt, units: reading.units })
      .select('id, taken_at, units, created_by')
      .single()

    if (error) {
      setError(error.message)
      return false
    }
    setError(null)
    setReadings((prev) => [...prev, toReading(data)])
    return true // lets the form know it can close
  }

  async function deleteReading(id: string) {
    const { error } = await supabase.from('readings').delete().eq('id', id)

    if (error) {
      setError(error.message)
      return
    }
    setReadings((prev) => prev.filter((r) => r.id !== id))
  }

  async function addRecharge(recharge: NewRecharge) {
    const { data, error } = await supabase
      .from('recharges')
      .insert({
        taken_at: recharge.takenAt,
        units: recharge.units,
        amount: recharge.amount,
      })
      .select('id, taken_at, units, amount, created_by')
      .single()

    if (error) {
      setError(error.message)
      return false
    }
    setError(null)
    setRecharges((prev) => [...prev, toRecharge(data)])
    return true
  }

  async function deleteRecharge(id: string) {
    const { error } = await supabase.from('recharges').delete().eq('id', id)

    if (error) {
      setError(error.message)
      return
    }
    setRecharges((prev) => prev.filter((r) => r.id !== id))
  }

  return {
    readings,
    recharges,
    loading,
    error,
    addReading,
    deleteReading,
    addRecharge,
    deleteRecharge,
  }
}