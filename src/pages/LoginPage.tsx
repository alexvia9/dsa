import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabaseClient'

export function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!isSupabaseConfigured()) {
    return (
      <div className="login-page">
        <div className="login-card card">
          <h1 className="login-title">Cloud sign-in unavailable</h1>
          <p className="muted">
            Add <code className="login-code">VITE_SUPABASE_URL</code> (Project URL) and{' '}
            <code className="login-code">VITE_SUPABASE_ANON_KEY</code> (Publishable key
            from Supabase → Project Settings → API) to{' '}
            <code className="login-code">.env</code>, then restart the dev server.
          </p>
        </div>
      </div>
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setBusy(true)
    try {
      const fn = mode === 'signIn' ? signIn : signUp
      const { error } = await fn(email, password)
      if (error) {
        setMessage(error.message)
        return
      }
      if (mode === 'signUp') {
        setMessage(
          'Check your email to confirm your account (if confirmation is enabled in Supabase), then sign in.',
        )
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card card">
        <p className="brand-mark login-brand-mark" aria-hidden>
          DSA
        </p>
        <h1 className="login-title">Dad Savings Account</h1>
        <p className="muted login-lede">
          Sign in to load and save your family data from the cloud.
        </p>

        <div className="login-mode-toggle" role="group" aria-label="Account mode">
          <button
            type="button"
            className={
              mode === 'signIn'
                ? 'btn secondary btn-compact is-active'
                : 'btn secondary btn-compact'
            }
            onClick={() => {
              setMode('signIn')
              setMessage(null)
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={
              mode === 'signUp'
                ? 'btn secondary btn-compact is-active'
                : 'btn secondary btn-compact'
            }
            onClick={() => {
              setMode('signUp')
              setMessage(null)
            }}
          >
            Create account
          </button>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <label className="field">
            <span className="label">Email</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span className="label">Password</span>
            <input
              className="input"
              type="password"
              autoComplete={
                mode === 'signIn' ? 'current-password' : 'new-password'
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
          {message ? (
            <p className={`login-message ${mode === 'signUp' && !message.includes('failed') && !message.includes('Invalid') ? 'login-message--info' : ''}`}>
              {message}
            </p>
          ) : null}
          <button type="submit" className="btn primary login-submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signIn' ? 'Sign in' : 'Sign up'}
          </button>
        </form>
      </div>
    </div>
  )
}
