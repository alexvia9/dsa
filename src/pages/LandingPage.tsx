import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AccountTypesOverview } from '../components/AccountTypesOverview'
import { LandingProductPreview } from '../components/LandingProductPreview'
import { DsaLogoMark, DsaMonogram } from '../components/DsaLogoMark'
import { useAuth } from '../context/AuthContext'
import { SiteFooter } from '../components/SiteFooter'
import { APP_TITLE, usePageTitle } from '../lib/pageTitle'
import { isSupabaseConfigured } from '../lib/supabaseClient'

export function LandingPage() {
  const { session, openAuthModal, loading, authModalOpen } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const cloud = isSupabaseConfigured()
  usePageTitle(authModalOpen ? null : APP_TITLE)

  useEffect(() => {
    if (!loading && session) {
      navigate('/family', { replace: true })
    }
  }, [session, loading, navigate])

  useEffect(() => {
    const state = location.state as { signIn?: boolean } | null
    if (state?.signIn && cloud) {
      openAuthModal('signIn')
      navigate('/', { replace: true, state: null })
    }
  }, [location.state, cloud, openAuthModal, navigate])

  return (
    <div className="landing-page">
      <header className="site-header">
        <div className="brand">
          <DsaLogoMark className="brand-mark" variant="green" />
          <DsaMonogram className="brand-monogram" />
          <span className="brand-text">
            <span className="brand-title">Dad Savings Account</span>
            <span className="brand-tagline">Kids&apos; money, one place</span>
          </span>
        </div>
        <nav className="site-nav" aria-label="Account">
          {cloud ? (
            <>
              <button
                type="button"
                className="btn secondary btn-compact"
                onClick={() => openAuthModal('signIn')}
              >
                Sign in
              </button>
              <button
                type="button"
                className="btn primary btn-compact"
                onClick={() => openAuthModal('signUp')}
              >
                Get started
              </button>
            </>
          ) : (
            <Link to="/family" className="btn primary btn-compact">
              Open demo
            </Link>
          )}
        </nav>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <h1 className="landing-headline">
              Get them excited to watch what waiting does
            </h1>
            <p className="landing-lede">
              Dad (or Mom) takes the cash and tracks it, so the piggy bank stays
              in one piece. One jar holds what they saved. The other adds a
              percent you choose at the end of the month, and that number is
              what gets them excited to wait.
            </p>
            <div className="landing-hero-actions">
              {cloud ? (
                <button
                  type="button"
                  className="btn primary btn-lg"
                  onClick={() => openAuthModal('signUp')}
                >
                  Get started
                </button>
              ) : (
                <Link to="/family" className="btn primary btn-lg">
                  Try the demo
                </Link>
              )}
            </div>
            <p className="landing-disclaimer-inline">
              Balances are pretend, and you hold the real cash. Savings is
              like a bank. The market line is like a brokerage account, and
              it can go down. DSA is not a bank or a brokerage.
            </p>
          </div>
          <LandingProductPreview />
        </section>

        <AccountTypesOverview
          variant="landing"
          story
          title="How each balance behaves"
          lede="A piggy bank holds the cash. A month-end jar adds a percent you choose. Savings is like a bank: a steady rate. The market is like a brokerage account: the balance can rise or fall."
        />

        <section className="landing-cta">
          <div className="landing-cta-inner">
            <h2 className="landing-cta-title">Start with this month&apos;s allowance</h2>
            <p>
              Take this month&apos;s allowance, log it, and leave the piggy bank
              on the shelf. At month-end, the save jar shows the percent you
              set.
            </p>
            {cloud ? (
              <button
                type="button"
                className="btn primary btn-lg"
                onClick={() => openAuthModal('signUp')}
              >
                Get started
              </button>
            ) : (
              <Link to="/family" className="btn primary btn-lg">
                Open demo
              </Link>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
