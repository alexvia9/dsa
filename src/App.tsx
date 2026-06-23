import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthModal } from './components/AuthModal'
import { Layout } from './components/Layout'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DsaProvider, useDsa } from './context/DsaContext'
import { isSupabaseConfigured } from './lib/supabaseClient'
import { AccountPage } from './pages/AccountPage'
import { FamilyHomeRoute } from './pages/FamilyHomeRoute'
import { KidPage } from './pages/KidPage'
import { LandingPage } from './pages/LandingPage'
import './App.css'

function DsaBootGate({ children }: { children: ReactNode }) {
  const { remoteHydrated, cloudLoadStatus, retryCloudLoad } = useDsa()

  if (!remoteHydrated || cloudLoadStatus === 'loading') {
    return (
      <div className="app-boot">
        <p className="app-boot-text">Loading your saved family…</p>
      </div>
    )
  }

  if (cloudLoadStatus === 'error') {
    return (
      <div className="app-boot">
        <p className="app-boot-text">
          Couldn&apos;t load your saved family from the cloud.
        </p>
        <p className="muted small app-boot-detail">
          Your data was not changed. Check your connection and try again.
        </p>
        <button
          type="button"
          className="btn primary"
          onClick={retryCloudLoad}
        >
          Retry
        </button>
      </div>
    )
  }

  return children
}

function ProtectedShell() {
  const configured = isSupabaseConfigured()
  const { session } = useAuth()

  if (configured && !session) {
    return <Navigate to="/" replace state={{ signIn: true }} />
  }

  const remoteUserId = configured && session ? session.user.id : null

  return (
    <DsaProvider remoteUserId={remoteUserId}>
      <DsaBootGate>
        <Layout />
      </DsaBootGate>
    </DsaProvider>
  )
}

function AppRoutes() {
  const { loading, authInitError } = useAuth()
  const configured = isSupabaseConfigured()

  if (configured && loading) {
    return (
      <div className="app-boot">
        <p className="app-boot-text muted">Loading…</p>
      </div>
    )
  }

  if (configured && authInitError) {
    return (
      <div className="app-boot">
        <p className="app-boot-text">{authInitError}</p>
        <p className="muted small app-boot-detail">
          Check that your Supabase project is active and that{' '}
          <code>VITE_SUPABASE_URL</code> in GitHub Actions secrets matches the
          project URL in the Supabase dashboard.
        </p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<ProtectedShell />}>
        <Route path="/family" element={<FamilyHomeRoute />} />
        <Route path="/kids/:kidId" element={<KidPage />} />
        <Route path="/accounts/:accountId" element={<AccountPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const routerBasename =
    import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

  return (
    <AuthProvider>
      <BrowserRouter basename={routerBasename}>
        <AuthModal />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
