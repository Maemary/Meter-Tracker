import type { Session } from '@supabase/supabase-js'
import App from './App'
import { Onboarding } from './components/Onboarding'
import { SignIn } from './components/SignIn'
import { isValidMeterNumber } from './discos'
import type { DiscoCode, SignUpDetails } from './types'
import { useMeter } from './useMeter'
import { useSession } from './useSession'

function Splash() {
  return (
    <div className="splash">
      <span className="spinner" aria-hidden="true" />
      <span className="muted">Loading…</span>
    </div>
  )
}

export function Root() {
  const { session, loading } = useSession()

  if (loading) return <Splash />
  if (!session) return <SignIn />

  // key: if a different person signs in, start fresh
  return <SignedIn key={session.user.id} session={session} />
}

// Details typed on the sign-up form are saved on the account
function signUpDetails(session: Session): SignUpDetails | null {
  const details = session.user.user_metadata as {
    meter_number?: string
    disco?: DiscoCode
    invite_code?: string
  }
  if (!details.meter_number || !isValidMeterNumber(details.meter_number)) return null
  return {
    meterNumber: details.meter_number,
    disco: details.disco ?? null,
    inviteCode: details.invite_code ?? null,
  }
}

// Signed in: make sure the account has a meter before showing the dashboard
function SignedIn({ session }: { session: Session }) {
  const fromSignUp = signUpDetails(session)
  const { meter, loading, error, createMeter, joinMeter, leaveHousehold } = useMeter(
    session.user.id,
    fromSignUp,
  )

  if (loading) return <Splash />

  // No meter yet (or the automatic create/join failed): ask
  if (!meter) {
    return (
      <Onboarding
        defaultMeterNumber={fromSignUp?.meterNumber ?? ''}
        defaultDisco={fromSignUp?.disco ?? ''}
        defaultInviteCode={fromSignUp?.inviteCode ?? ''}
        error={error}
        onCreate={createMeter}
        onJoin={joinMeter}
      />
    )
  }

  const savedName = session.user.user_metadata.display_name as string | undefined

  return (
    <App
      meter={meter}
      userId={session.user.id}
      email={session.user.email ?? ''}
      savedName={savedName ?? null}
      onLeave={leaveHousehold}
    />
  )
}
