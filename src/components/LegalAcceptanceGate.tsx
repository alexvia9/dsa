import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { parentHasLegalAck, recordLegalAck } from '../lib/legalAck'
import { pageTitle, usePageTitle } from '../lib/pageTitle'
import { isSupabaseConfigured } from '../lib/supabaseClient'

/**
 * Parents who already have an account accept the same age attestation and
 * terms the signup form collects. Demo mode (no cloud sign-in) skips this.
 */
export function LegalAcceptanceGate({ children }: { children: ReactNode }) {
  const { session, signOut } = useAuth()
  const configured = isSupabaseConfigured()
  const userId = session?.user.id
  const email = session?.user.email
  const [status, setStatus] = useState<'checking' | 'needed' | 'ok'>(() =>
    configured && userId ? 'checking' : 'ok',
  )
  const [adult, setAdult] = useState(false)
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  usePageTitle(
    status === 'ok'
      ? null
      : pageTitle(status === 'checking' ? 'Loading' : 'Before you continue'),
  )

  useEffect(() => {
    if (!configured || !userId) {
      setStatus('ok')
      return
    }
    let cancelled = false
    setStatus('checking')
    void parentHasLegalAck(userId, email).then((ok) => {
      if (!cancelled) setStatus(ok ? 'ok' : 'needed')
    })
    return () => {
      cancelled = true
    }
  }, [configured, userId, email])

  if (status === 'ok') return children

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!userId || !adult || !agree) return
    setBusy(true)
    try {
      await recordLegalAck(userId)
      setStatus('ok')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-boot legal-gate">
      {status === 'checking' ? (
        <p className="app-boot-text muted">Loading…</p>
      ) : (
        <form className="card legal-gate-card" onSubmit={(e) => void onSubmit(e)}>
          <h1 className="legal-gate-title">Before you continue</h1>
          <p className="muted small">
            DSA is a teaching ledger for a parent or guardian. You enter your
            child’s name and every deposit and withdrawal. Children do not
            create accounts.
          </p>
          <label className="auth-check">
            <input
              type="checkbox"
              checked={adult}
              onChange={(e) => setAdult(e.target.checked)}
              required
            />
            <span>
              I am a parent or legal guardian, and I am 18 or older. I will
              enter my child’s name and every deposit and withdrawal.
            </span>
          </label>
          <label className="auth-check">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              required
            />
            <span>
              I agree to the <Link to="/terms">Terms of Use</Link> and{' '}
              <Link to="/privacy">Privacy Policy</Link>.
            </span>
          </label>
          <div className="legal-gate-actions">
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? 'Saving…' : 'Continue'}
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={() => void signOut()}
            >
              Sign out
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
