import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AddChildFlow } from '../components/AddChildFlow'
import { KidAvatar } from '../components/KidAvatar'
import { useAuth } from '../context/AuthContext'
import { useDsa } from '../context/DsaContext'
import { confirmCloseChild } from '../lib/confirmCloseChild'
import { formatUsd } from '../lib/money'
import { isSupabaseConfigured } from '../lib/supabaseClient'

export function UserAccountPage() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const email = session?.user.email ?? null
  const cloud = isSupabaseConfigured() && session != null

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="page user-account-page">
      <header className="page-header">
        <h1>Your account</h1>
        <p className="lede">
          {email
            ? `Signed in as ${email}. Update your login, or manage the children in this family.`
            : 'Manage the children in this family.'}
        </p>
      </header>

      {cloud && email ? (
        <>
          <EmailSection currentEmail={email} />
          <PasswordSection />
        </>
      ) : null}

      <ChildrenSection />

      {cloud ? (
        <section className="card user-account-section">
          <h2 className="card-title">Sign out</h2>
          <p className="hint">
            You will need to sign in again to open this family.
          </p>
          <button
            type="button"
            className="btn secondary"
            onClick={() => void handleSignOut()}
          >
            Sign out
          </button>
        </section>
      ) : null}
    </div>
  )
}

function EmailSection({ currentEmail }: { currentEmail: string }) {
  const { updateEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<'error' | 'info'>('error')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const next = email.trim()
    setMessage(null)
    if (next.toLowerCase() === currentEmail.toLowerCase()) {
      setMessageTone('error')
      setMessage('That is already the email on this account.')
      return
    }
    setBusy(true)
    try {
      const { error, pendingEmail } = await updateEmail(next)
      if (error) {
        setMessageTone('error')
        setMessage(error.message)
        return
      }
      setEmail('')
      setMessageTone('info')
      setMessage(
        pendingEmail
          ? `Confirm the change from both ${currentEmail} and ${pendingEmail}. The email on this account stays the same until you do.`
          : 'Email updated.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card user-account-section">
      <h2 className="card-title">Email</h2>
      <p className="hint">
        Current email is <strong>{currentEmail}</strong>. A change is confirmed
        from both inboxes before it takes effect.
      </p>
      <form className="user-account-form" onSubmit={(e) => void onSubmit(e)}>
        <label className="field">
          <span className="label">New email</span>
          <input
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        {message ? (
          <p
            className={
              messageTone === 'info'
                ? 'login-message login-message--info'
                : 'login-message'
            }
            role={messageTone === 'error' ? 'alert' : 'status'}
          >
            {message}
          </p>
        ) : null}
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? 'Saving…' : 'Update email'}
        </button>
      </form>
    </section>
  )
}

function PasswordSection() {
  const { updatePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<'error' | 'info'>('error')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (newPassword !== confirmPassword) {
      setMessageTone('error')
      setMessage('New password and confirmation do not match.')
      return
    }
    if (newPassword === currentPassword) {
      setMessageTone('error')
      setMessage('Choose a password that is different from the current one.')
      return
    }
    setBusy(true)
    try {
      const { error } = await updatePassword(currentPassword, newPassword)
      if (error) {
        setMessageTone('error')
        setMessage(error.message)
        return
      }
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessageTone('info')
      setMessage('Password updated. You stay signed in on this device.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card user-account-section">
      <h2 className="card-title">Password</h2>
      <p className="hint">
        Enter your current password, then choose a new one with at least 6
        characters.
      </p>
      <form className="user-account-form" onSubmit={(e) => void onSubmit(e)}>
        <label className="field">
          <span className="label">Current password</span>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span className="label">New password</span>
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>
        <label className="field">
          <span className="label">Confirm new password</span>
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>
        {message ? (
          <p
            className={
              messageTone === 'info'
                ? 'login-message login-message--info'
                : 'login-message'
            }
            role={messageTone === 'error' ? 'alert' : 'status'}
          >
            {message}
          </p>
        ) : null}
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </section>
  )
}

function ChildrenSection() {
  const { state, closeKid } = useDsa()

  return (
    <section className="card user-account-section">
      <h2 className="card-title">Children</h2>
      <p className="hint">
        Open a child to work with their accounts, or remove them from the
        family.
      </p>
      {state.kids.length === 0 ? (
        <p className="user-account-empty">No children yet.</p>
      ) : (
        <ul className="user-account-kids">
          {state.kids.map((kid) => {
            const accounts = state.accounts.filter((a) => a.kidId === kid.id)
            const total = accounts.reduce((s, a) => s + a.balanceCents, 0)
            return (
              <li key={kid.id} className="user-account-kid">
                <Link to={`/kids/${kid.id}`} className="user-account-kid-link">
                  <KidAvatar name={kid.name} colorId={kid.avatarColor} />
                  <span className="user-account-kid-text">
                    <span className="user-account-kid-name">{kid.name}</span>
                    <span className="user-account-kid-meta">
                      {accounts.length === 0
                        ? 'No accounts yet'
                        : `${accounts.length} account${accounts.length === 1 ? '' : 's'} · ${formatUsd(total)}`}
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  className="btn link danger user-account-remove"
                  onClick={() => {
                    if (!confirmCloseChild(kid, accounts.length, total)) return
                    closeKid(kid.id)
                  }}
                >
                  Remove
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <AddChildFlow
        variant="standalone"
        navigateTo="stay"
        ctaLabel="Add a child"
      />
    </section>
  )
}
