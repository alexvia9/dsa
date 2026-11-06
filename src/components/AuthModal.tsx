import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { markSignupLegalPending } from '../lib/legalAck'
import { pageTitle } from '../lib/pageTitle'
import { isSupabaseConfigured } from '../lib/supabaseClient'

export function AuthModal() {
  const {
    authModalOpen,
    authModalMode,
    closeAuthModal,
    openAuthModal,
    signIn,
    signUp,
    session,
  } = useAuth()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [adult, setAdult] = useState(false)
  const [agree, setAgree] = useState(false)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (authModalOpen && !el.open) {
      el.showModal()
    } else if (!authModalOpen && el.open) {
      el.close()
    }
  }, [authModalOpen])

  useEffect(() => {
    if (session && authModalOpen) {
      closeAuthModal()
      navigate('/family', { replace: true })
    }
  }, [session, authModalOpen, closeAuthModal, navigate])

  useEffect(() => {
    if (authModalOpen) {
      setEmail('')
      setPassword('')
      setMessage(null)
      setAdult(false)
      setAgree(false)
    }
  }, [authModalOpen, authModalMode])

  useEffect(() => {
    if (!authModalOpen) return
    const previous = document.title
    document.title = pageTitle(
      authModalMode === 'signIn' ? 'Sign in' : 'Create account',
    )
    return () => {
      document.title = previous
    }
  }, [authModalOpen, authModalMode])

  if (!isSupabaseConfigured()) return null

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setBusy(true)
    try {
      const fn = authModalMode === 'signIn' ? signIn : signUp
      const { error } = await fn(email, password)
      if (error) {
        setMessage(error.message)
        return
      }
      if (authModalMode === 'signUp') {
        markSignupLegalPending(email)
        setMessage(
          'Check your email to confirm your account (if confirmation is enabled), then sign in.',
        )
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="strategy-rule-modal auth-modal"
      onClose={closeAuthModal}
      aria-labelledby="auth-modal-title"
    >
      <form className="strategy-modal-box auth-modal-box" onSubmit={onSubmit}>
        <header className="strategy-modal-header">
          <h2 id="auth-modal-title" className="strategy-modal-title">
            {authModalMode === 'signIn' ? 'Sign in' : 'Create account'}
          </h2>
          <button
            type="button"
            className="btn modal-close-btn"
            onClick={closeAuthModal}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="strategy-modal-body auth-modal-body">
          <p className="muted small auth-modal-lede">
            {authModalMode === 'signUp'
              ? 'For a parent or guardian. You enter your child’s name and every ledger line. Children do not create accounts.'
              : 'Your family data is saved to the cloud when you sign in.'}
          </p>

          <div
            className="login-mode-toggle auth-modal-mode-toggle"
            role="group"
            aria-label="Sign in or sign up"
          >
            <button
              type="button"
              className={
                authModalMode === 'signIn'
                  ? 'btn secondary btn-compact is-active'
                  : 'btn secondary btn-compact'
              }
              onClick={() => openAuthModal('signIn')}
            >
              Sign in
            </button>
            <button
              type="button"
              className={
                authModalMode === 'signUp'
                  ? 'btn secondary btn-compact is-active'
                  : 'btn secondary btn-compact'
              }
              onClick={() => openAuthModal('signUp')}
            >
              Create account
            </button>
          </div>

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
                authModalMode === 'signIn' ? 'current-password' : 'new-password'
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
          {authModalMode === 'signUp' ? (
            <>
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
                  Children do not create accounts.
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
                  I agree to the{' '}
                  <Link to="/terms" onClick={closeAuthModal}>
                    Terms of Use
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" onClick={closeAuthModal}>
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            </>
          ) : null}
          {message ? (
            <p
              className={`login-message ${
                authModalMode === 'signUp' &&
                !message.includes('failed') &&
                !message.includes('Invalid')
                  ? 'login-message--info'
                  : ''
              }`}
              role={
                authModalMode === 'signUp' &&
                !message.includes('failed') &&
                !message.includes('Invalid')
                  ? 'status'
                  : 'alert'
              }
            >
              {message}
            </p>
          ) : null}
        </div>

        <footer className="strategy-modal-footer">
          <button type="submit" className="btn primary" disabled={busy}>
            {busy
              ? 'Please wait…'
              : authModalMode === 'signIn'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}
