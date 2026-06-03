import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'

type AuthContextValue = {
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(() => isSupabaseConfigured())

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const supabase = getSupabase()!
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!cancelled) {
        setSession(s)
        setLoading(false)
      }
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
      signIn,
      signUp,
      signOut,
    }),
    [session, loading, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
