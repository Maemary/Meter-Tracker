import { useState } from 'react'
import { formatInviteCode, formatMeterNumber } from '../discos'
import { memberName } from '../format'
import type { Member } from '../types'
import { UsersIcon } from './icons'

type Props = {
  members: Member[]
  inviteCode: string
  meterNumber: string
  isOwner: boolean
  currentUserId: string
  error: string | null
  onRemove: (userId: string) => void
  onNewCode: () => void
  onLeave: () => void
}

// Invite people to the meter, see who's in, remove/leave
export function HouseholdCard({
  members,
  inviteCode,
  meterNumber,
  isOwner,
  currentUserId,
  error,
  onRemove,
  onNewCode,
  onLeave,
}: Props) {
  const [copied, setCopied] = useState(false)
  const code = formatInviteCode(inviteCode)

  const shareText =
    `Join our meter on Meter Tracker: ${window.location.origin}\n` +
    `Tap "Create account", then "Join with their invite code".\n` +
    `Invite code: ${code}\nMeter number: ${formatMeterNumber(meterNumber)}`

  async function share() {
    // Phones: open the share sheet (WhatsApp, SMS…). Laptops: copy instead.
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join our meter', text: shareText })
        return
      } catch {
        // cancelled: fall through to copying
      }
    }
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard blocked; the code is still visible to read out
    }
  }

  function confirmRemove(member: Member) {
    if (window.confirm(`Remove ${memberName(member)} from this meter? They'll lose access.`)) {
      onRemove(member.userId)
    }
  }

  function confirmLeave() {
    if (window.confirm("Leave this household? You'll stop seeing its entries.")) {
      onLeave()
    }
  }

  return (
    <section className="card household">
      <div className="card-head">
        <div>
          <h2>Household</h2>
          <p className="muted">Everyone here shares one dashboard</p>
        </div>
        <span className="household-icon">
          <UsersIcon />
        </span>
      </div>

      <div className="invite">
        <span className="muted">Invite code</span>
        <strong className="invite-code">{code}</strong>
        <div className="invite-actions">
          <button type="button" className="small-button primary" onClick={share}>
            {copied ? 'Copied!' : 'Invite someone'}
          </button>
          {isOwner && (
            <button type="button" className="small-button" onClick={onNewCode}>
              New code
            </button>
          )}
        </div>
        <p className="muted invite-note">
          They'll need this code and your meter number to join.
        </p>
      </div>

      <ul className="rows members">
        {members.map((m) => (
          <li key={m.userId}>
            <span className="member">
              <span className="avatar">{memberName(m).charAt(0).toUpperCase()}</span>
              <span className="row-main">
                <strong>
                  {memberName(m)}
                  {m.userId === currentUserId && <span className="muted"> (you)</span>}
                </strong>
                <span className="muted">{m.role === 'owner' ? 'Owner' : 'Member'}</span>
              </span>
            </span>
            {isOwner && m.userId !== currentUserId && (
              <button className="danger" onClick={() => confirmRemove(m)}>
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      {!isOwner && (
        <button type="button" className="danger leave" onClick={confirmLeave}>
          Leave household
        </button>
      )}
      {error && <p className="error">{error}</p>}
    </section>
  )
}
