import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DsaProvider, useDsa } from './context/DsaContext'
import { isSupabaseConfigured } from './lib/supabaseClient'
import { AccountPage } from './pages/AccountPage'
import { FamilyPage } from './pages/FamilyPage'
import { KidPage } from './pages/KidPage'
import { LoginPage } from './pages/LoginPage'
import './App.css'

function DsaBootGate({ children }: { children: ReactNode }) {
  const { remoteHydrated } = useDsa()
  if (!remoteHydrated) {
    return (
      <div className="app-boot">
        <p className="app-boot-text">Loading your saved family…</p>
      </div>
    )
  }
  return children
}

function AppRoutes() {
  const configured = isSupabaseConfigured()
  const { session, loading } = useAuth()

  if (configured && loading) {
    return (
      <div className="app-boot">
        <p className="app-boot-text muted">Loading…</p>
      </div>
    )
  }

  if (configured && !session) {
    return <LoginPage />
  }

  const remoteUserId = configured && session ? session.user.id : null
  const routerBasename =
    import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

  return (
    <DsaProvider remoteUserId={remoteUserId}>
      <BrowserRouter basename={routerBasename}>
        <DsaBootGate>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<FamilyPage />} />
              <Route path="/kids/:kidId" element={<KidPage />} />
              <Route path="/accounts/:accountId" element={<AccountPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </DsaBootGate>
      </BrowserRouter>
    </DsaProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
