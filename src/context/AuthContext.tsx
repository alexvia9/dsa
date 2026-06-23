import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { promiseWithTimeout } from '../lib/promiseWithTimeout'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'

type AuthModalMode = 'signIn' | 'signUp'

const AUTH_SESSION_TIMEOUT_MS = 10_000

type AuthContextValue = {
  session: Session | null
  loading: boolean
  /** Set when the initial session check fails (e.g. Supabase unreachable). */
  authInitError: string | null
  authModalOpen: boolean
  authModalMode: AuthModalMode
  openAuthModal: (mode?: AuthModalMode) => void
  closeAuthModal: () => void
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(() => isSupabaseConfigured())
  const [authInitError, setAuthInitError] = useState<string | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('signIn')

  const openAuthModal = useMemo(
    () => (mode: AuthModalMode = 'signIn') => {
      setAuthModalMode(mode)
      setAuthModalOpen(true)
    },
    [],
  )

  const closeAuthModal = useMemo(() => () => setAuthModalOpen(false), [])

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const supabase = getSupabase()!
    let cancelled = false

    void promiseWithTimeout(
      supabase.auth.getSession(),
      AUTH_SESSION_TIMEOUT_MS,
      'Cloud sign-in check timed out',
    )
      .then(({ data: { session: s } }) => {
        if (cancelled) return
        setSession(s)
        setAuthInitError(null)
      })
      .catch((err) => {
        console.error('[DSA] Auth session check failed', err)
        if (!cancelled) {
          setAuthInitError(
            'Could not reach cloud sign-in. Your Supabase project may be paused, deleted, or misconfigured.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useMemo(
    () => async (email: string, password: string) => {
      const supabase = getSupabase()
      if (!supabase) {
        return { error: new Error('Supabase is not configured') }
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      return { error: error ? new Error(error.message) : null }
    },
    [],
  )

  const signUp = useMemo(
    () => async (email: string, password: string) => {
      const supabase = getSupabase()
      if (!supabase) {
        return { error: new Error('Supabase is not configured') }
      }
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })
      return { error: error ? new Error(error.message) : null }
    },
    [],
  )

  const signOut = useMemo(
    () => async () => {
      const supabase = getSupabase()
      if (!supabase) return
      await supabase.auth.signOut()
    },
    [],
  )

  const value = useMemo(
    () => ({
      session,
      loading,
      authInitError,
      authModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal,
      signIn,
      signUp,
      signOut,
    }),
    [
      session,
      loading,
      authInitError,
      authModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal,
      signIn,
      signUp,
      signOut,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
