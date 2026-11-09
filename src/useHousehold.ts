import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { Member } from './types'

type MemberRow = {
  user_id: string
  display_name: string | null
  email: string
  role: 'owner' | 'member'
}

function fetchMembers() {
  return supabase.rpc('household_members')
}

// Everyone who shares this meter, plus the owner's tools
export function useHousehold(meterId: string, startingCode: string) {
  const [members, setMembers] = useState<Member[]>([])
  const [inviteCode, setInviteCode] = useState(startingCode)
  const [error, setError] = useState<string | null>(null)

  function applyResult(result: Awaited<ReturnType<typeof fetchMembers>>) {
    if (result.error) {
      setError(result.error.message)
      return
    }
    setError(null)
    setMembers(
      ((result.data ?? []) as MemberRow[]).map((row) => ({
        userId: row.user_id,
        displayName: row.display_name,
        email: row.email,
        role: row.role,
      })),
    )
  }

  async function refresh() {
    applyResult(await fetchMembers())
  }

  useEffect(() => {
    let cancelled = false
    fetchMembers().then((result) => {
      if (!cancelled) applyResult(result)
    })
    // If the meter changes before the answer arrives, ignore the old answer
    return () => {
      cancelled = true
    }
  }, [meterId])

  async function removeMember(userId: string) {
    const { error } = await supabase.rpc('remove_member', { p_user_id: userId })
    if (error) setError(error.message)
    else await refresh()
  }

  async function newCode() {
    const { data, error } = await supabase.rpc('reset_invite_code')
    if (error) setError(error.message)
    else setInviteCode(data as string)
  }

  return { members, inviteCode, error, removeMember, newCode }
}
