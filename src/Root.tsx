import type { Session } from '@supabase/supabase-js'
import App from './App'
import { Onboarding } from './components/Onboarding'
import { SignIn } from './components/SignIn'
import { isValidMeterNumber } from './discos'
import type { DiscoCode, NewMeter } from './types'
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
function signUpDetails(session: Session): NewMeter | null {
  const details = session.user.user_metadata as {
    meter_number?: string
    disco?: DiscoCode
  }
  if (!details.meter_number || !details.disco) return null
  if (!isValidMeterNumber(details.meter_number)) return null
  return { meterNumber: details.meter_number, disco: details.disco, nickname: null }
}

// Signed in: make sure the account has a meter before showing the dashboard
function SignedIn({ session }: { session: Session }) {
  const fromSignUp = signUpDetails(session)
  const { meter, loading, error, createMeter } = useMeter(session.user.id, fromSignUp)

  if (loading) return <Splash />

  // Only shown if the meter couldn't be created automatically
  if (!meter) {
    return (
      <Onboarding
        defaultMeterNumber={fromSignUp?.meterNumber ?? ''}
        defaultDisco={fromSignUp?.disco ?? ''}
        error={error}
        onCreate={createMeter}
      />
    )
  }

  return <App meter={meter} email={session.user.email ?? ''} />
}
