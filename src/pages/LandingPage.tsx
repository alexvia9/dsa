import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AccountTypesOverview } from '../components/AccountTypesOverview'
import { LandingProductPreview } from '../components/LandingProductPreview'
import { DsaLogoMark, DsaMonogram } from '../components/DsaLogoMark'
import { useAuth } from '../context/AuthContext'
import { SiteFooter } from '../components/SiteFooter'
import { APP_TITLE, usePageTitle } from '../lib/pageTitle'
import { isSupabaseConfigured } from '../lib/supabaseClient'

const FEATURES = [
  {
    title: 'All jars in one view',
    body: 'See save, give, and spend for every child—no more counting cash across the counter or digging through envelopes.',
  },
  {
    title: 'Quick to update',
    body: 'Log allowance or a purchase in seconds when money moves. Balances stay current without spreadsheets or mental math.',
  },
  {
    title: 'Growth, calculated for you',
    body: 'Interest and moves like the market follow the teaching rules, so you and your kids can see progress—not just the last deposit. The balances stay pretend.',
  },
  {
    title: 'Sync across devices',
    bodyCloud:
      'Sign in once; jar balances stay up to date on your phone or tablet.',
    bodyLocal:
      'Connect Supabase to keep jar balances in sync across phones, tablets, and laptops.',
  },
] as const

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
            <ul className="landing-trust-row" aria-label="Product highlights">
              <li>Easy to track</li>
              <li>No real money moved</li>
              <li>Save · give · spend</li>
            </ul>
            <h1 className="landing-headline">
              The simple way to track your kids&apos; money
            </h1>
            <p className="landing-lede">
              DSA replaces envelope jars with one clear view. You still hold the
              cash. Save, give, and spend are the jars—compare a piggy bank with
              month-end growth, and open savings or the market when you want
              that money to grow like savings or like the market.
            </p>
            <div className="landing-hero-actions">
              {cloud ? (
                <>
                  <button
                    type="button"
                    className="btn primary btn-lg"
                    onClick={() => openAuthModal('signUp')}
                  >
                    Get started
                  </button>
                  <button
                    type="button"
                    className="btn secondary btn-lg"
                    onClick={() => openAuthModal('signIn')}
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <Link to="/family" className="btn primary btn-lg">
                  Try live demo
                </Link>
              )}
            </div>
            <p className="landing-disclaimer-inline">
              Simulation only—you hold all real money. Nothing is moved or invested
              through DSA. A market balance illustrates a published daily
              percentage change. It is not a quote and not for trading.
            </p>
          </div>
          <LandingProductPreview />
        </section>

        <section className="landing-section landing-section-features">
          <div className="landing-section-head">
            <h2 className="landing-section-title">Less mess, more clarity</h2>
            <p className="landing-section-lede">
              Stop guessing jar balances. DSA keeps the numbers straight while you
              stay in charge of the cash—no bank account, no extra apps moving
              real dollars.
            </p>
          </div>
          <ul className="landing-feature-grid">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="landing-feature-card">
                <h3>{feature.title}</h3>
                <p>
                  {'bodyCloud' in feature
                    ? cloud
                      ? feature.bodyCloud
                      : feature.bodyLocal
                    : feature.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <AccountTypesOverview
          variant="landing"
          title="Save, give, and spend"
          lede="Those are the jars. Run any of them as a piggy bank or a month-end account and compare the two. Accounts that grow like savings or like the market stay available the whole time."
        />

        <section className="landing-cta">
          <div className="landing-cta-inner">
            <h2 className="landing-cta-title">Know what each kid has—at a glance</h2>
            <p>
              Set up jars in minutes. A quick update when allowance hits or they
              spend keeps everyone on the same page—with room to teach along the
              way.
            </p>
              {cloud ? (
              <button
                type="button"
                className="btn primary btn-lg"
                onClick={() => openAuthModal('signUp')}
              >
                Get started — free
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
