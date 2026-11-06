import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { DsaLogoMark, DsaMonogram } from './DsaLogoMark'
import { KidAvatar } from './KidAvatar'
import { useAuth } from '../context/AuthContext'
import { useDsa } from '../context/DsaContext'
import { homeAppPath, showFamilyOverview } from '../lib/familyRouting'
import { isSupabaseConfigured } from '../lib/supabaseClient'

function kidFirstName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return 'Kid'
  return trimmed.split(/\s+/)[0] ?? trimmed
}

function pillClass(active: boolean, withAvatar = false): string {
  return `nav-link nav-pill${withAvatar ? ' nav-pill--kid' : ''}${active ? ' active' : ''}`
}

/** Account page → owning kid, so that kid's pill stays active off /kids/:id. */
function kidIdForAccountPath(
  pathname: string,
  accounts: { id: string; kidId: string }[],
): string | undefined {
  const match = pathname.match(/^\/accounts\/([^/]+)\/?$/)
  if (!match?.[1]) return undefined
  const accountId = decodeURIComponent(match[1])
  return accounts.find((account) => account.id === accountId)?.kidId
}

export function Layout() {
  const { pathname } = useLocation()
  const pillsRef = useRef<HTMLElement>(null)
  const { session, openAuthModal } = useAuth()
  const { state, syncError, clearSyncError } = useDsa()
  const cloudEnabled = isSupabaseConfigured()
  const appHome = homeAppPath(state.kids)
  const showFamilyNav = showFamilyOverview(state.kids.length)
  const accountKidId = kidIdForAccountPath(pathname, state.accounts)
  const isAccountSettings = pathname === '/account'

  useEffect(() => {
    const nav = pillsRef.current
    if (!nav) return
    const active = nav.querySelector<HTMLElement>('.nav-link.active')
    if (!active) return
    const navRect = nav.getBoundingClientRect()
    const pillRect = active.getBoundingClientRect()
    if (pillRect.left < navRect.left) {
      nav.scrollLeft -= navRect.left - pillRect.left
    } else if (pillRect.right > navRect.right) {
      nav.scrollLeft += pillRect.right - navRect.right
    }
  }, [pathname, accountKidId])

  const authButton =
    cloudEnabled && !session ? (
      <button
        type="button"
        className="btn secondary btn-compact site-nav-signout site-nav-auth"
        onClick={() => openAuthModal('signIn')}
      >
        Sign in
      </button>
    ) : null

  const showFamilyRow = showFamilyNav || state.kids.length > 0

  return (
    <div className="app-shell">
      <div className="app-chrome">
        <header className="site-header">
          <div className="brand">
            <Link to={appHome} className="brand-link">
              <DsaLogoMark className="brand-mark" variant="green" />
              <DsaMonogram className="brand-monogram" />
              <span className="brand-text">
                <span className="brand-title">Dad Savings Account</span>
                <span className="brand-tagline">Kids&apos; money, one place</span>
              </span>
            </Link>
          </div>
          <div className="site-header-actions">
            <NavLink
              to="/account"
              end
              className={({ isActive }) =>
                pillClass(isActive || isAccountSettings)
              }
            >
              Account
            </NavLink>
            {authButton}
          </div>
        </header>
        {showFamilyRow ? (
          <nav
            className="site-nav app-family-nav"
            aria-label="Family"
            ref={pillsRef}
          >
            {showFamilyNav ? (
              <NavLink
                to="/family"
                end
                className={({ isActive }) => pillClass(isActive)}
              >
                Family
              </NavLink>
            ) : null}
            {state.kids.map((kid) => {
              const kidPath = `/kids/${kid.id}`
              const active =
                pathname === kidPath ||
                pathname === `${kidPath}/` ||
                accountKidId === kid.id
              return (
                <Link
                  key={kid.id}
                  to={kidPath}
                  className={pillClass(active, true)}
                  aria-current={active ? 'page' : undefined}
                >
                  <KidAvatar
                    name={kid.name}
                    colorId={kid.avatarColor}
                    className="nav-pill-avatar"
                  />
                  <span className="nav-pill-label">{kidFirstName(kid.name)}</span>
                </Link>
              )
            })}
          </nav>
        ) : null}
      </div>

      <main className="site-main">
        {cloudEnabled && session && syncError ? (
          <div className="sync-error-banner" role="alert">
            <p>Couldn&apos;t save to the cloud: {syncError}</p>
            <button
              type="button"
              className="btn secondary btn-compact"
              onClick={clearSyncError}
            >
              Dismiss
            </button>
          </div>
        ) : null}
        <Outlet />
      </main>
    </div>
  )
}
