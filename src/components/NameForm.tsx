import { useState, type FormEvent } from 'react'
import { supabase } from '../supabase'

type Props = {
  current: string
  onDone: () => void
}

// Saves the name on the account itself (Supabase "user metadata"), so it
// follows you to any phone or laptop you log in on.
export function NameForm({ current, onDone }: Props) {
  const [name, setName] = useState(current)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      data: { display_name: name.trim() || null },
    })
    setSaving(false)
    // Success also fires an auth "USER_UPDATED" event, so useSession picks
    // up the new name and the greeting updates by itself.
    if (error) setFailed(true)
    else onDone()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-head">
        <h2>What should we call you?</h2>
        <p className="muted">Used in your greeting. Leave empty for none.</p>
      </div>
      <label>
        Your name
        <input
          data-autofocus
          autoComplete="given-name"
          maxLength={30}
          placeholder="e.g. Aisha"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save name'}
      </button>
      {failed && <p className="error">Couldn't save. Check your connection and try again.</p>}
    </form>
  )
}
