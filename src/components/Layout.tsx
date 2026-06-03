import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDsa } from '../context/DsaContext'
import { homeAppPath, showFamilyOverview } from '../lib/familyRouting'
import { isSupabaseConfigured } from '../lib/supabaseClient'

export function Layout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { session, signOut, openAuthModal } = useAuth()
  const { state } = useDsa()
  const cloudEnabled = isSupabaseConfigured()
  const appHome = homeAppPath(state.kids)
  const isFamily = pathname === '/family'
  const isKidView = pathname.startsWith('/kids/')
  const showFamilyNav = showFamilyOverview(state.kids.length)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand">
          <Link to={appHome} className="brand-link">
            <span className="brand-mark" aria-hidden>
              DSA
            </span>
            <span className="brand-text">
              <span className="brand-title">Dad Savings Account</span>
              <span className="brand-tagline">Family brokerage</span>
            </span>
          </Link>
        </div>
        <nav className="site-nav" aria-label="Main">
          {showFamilyNav ? (
            <Link
              to="/family"
              className={isFamily ? 'nav-link active' : 'nav-link'}
            >
              Family
            </Link>
          ) : null}
          {isKidView && state.kids.length === 1 ? (
            <span className="nav-context muted small">
              {state.kids[0]?.name}
            </span>
          ) : null}
          {isKidView && state.kids.length >= 2 ? (
            <span className="nav-context muted small">Child view</span>
          ) : null}
          {cloudEnabled && session ? (
            <button
              type="button"
              className="btn secondary btn-compact site-nav-signout"
              onClick={() => void handleSignOut()}
            >
              Sign out
            </button>
          ) : cloudEnabled && !session ? (
            <button
              type="button"
              className="btn secondary btn-compact site-nav-signout"
              onClick={() => openAuthModal('signIn')}
            >
              Sign in
            </button>
          ) : null}
        </nav>
      </header>

      <main className="site-main">
        <Outlet />
      </main>
    </div>
  )
}
