import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabaseClient'

export function Layout() {
  const { pathname } = useLocation()
  const { session, signOut } = useAuth()
  const isFamily = pathname === '/'
  const isKidView = pathname.startsWith('/kids/')
  const showAccountMenu = isSupabaseConfigured() && session

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand">
          <Link to="/" className="brand-link">
            <span className="brand-mark" aria-hidden>
              DSA
            </span>
            <span className="brand-text">
              <span className="brand-title">Dad Savings Account</span>
              <span className="brand-tagline">Family brokerage (teaching)</span>
            </span>
          </Link>
        </div>
        <nav className="site-nav" aria-label="Main">
          <Link to="/" className={isFamily ? 'nav-link active' : 'nav-link'}>
            Family
          </Link>
          {isKidView && (
            <span className="nav-context muted small">Child account view</span>
          )}
          {showAccountMenu ? (
            <button
              type="button"
              className="btn secondary btn-compact site-nav-signout"
              onClick={() => void signOut()}
            >
              Sign out
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
