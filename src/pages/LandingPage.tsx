import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LandingProductPreview } from '../components/LandingProductPreview'
import { DsaLogoMark, DsaMonogram } from '../components/DsaLogoMark'
import { StrategyTypeCardIcon } from '../components/icons/StrategyTypeIcons'
import {
  GROWTH_MODEL_ONE_LINE,
  accountTypeForMode,
} from '../lib/accountTypeCatalog'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import type { InvestmentStrategy } from '../types/dsa'

const ACCOUNT_TYPE_MODES = [
  'piggy_bank',
  'savings_apr',
  'monthly_end_compound',
  'stock_market',
] as const satisfies readonly InvestmentStrategy['mode'][]

const PRODUCT_SPECS: Record<
  InvestmentStrategy['mode'],
  { spec: string; tag: string }
> = {
  piggy_bank: { spec: '0% · cash only', tag: 'Spending' },
  savings_apr: { spec: 'Fixed APY · daily accrual', tag: 'Savings' },
  monthly_end_compound: { spec: 'Custom % · month-end', tag: 'Goals' },
  stock_market: { spec: 'S&P 500 · SPY daily', tag: 'Investing' },
}

const FEATURES = [
  {
    title: 'Household dashboard',
    body: 'See every child’s balances, accounts, and month-to-date change in one secure view.',
  },
  {
    title: 'Parent-controlled ledger',
    body: 'You record deposits, withdrawals, and notes—the same way a real custodial account works.',
  },
  {
    title: 'Performance tracking',
    body: 'Charts break out growth from new money so kids learn what the market and interest actually did.',
  },
  {
    title: 'Sync across devices',
    bodyCloud:
      'Sign in once; your family portfolio stays updated wherever you open DSA.',
    bodyLocal:
      'Connect Supabase to sync across phones, tablets, and laptops.',
  },
] as const

export function LandingPage() {
  const { session, openAuthModal, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const cloud = isSupabaseConfigured()

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
            <span className="brand-tagline">Family brokerage</span>
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
                Open account
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
              <li>Parent-controlled</li>
              <li>Real market data</li>
              <li>Private family ledger</li>
            </ul>
            <h1 className="landing-headline">
              The family investing experience kids can grow into
            </h1>
            <p className="landing-lede">
              DSA combines a Greenlight-style household view with
              brokerage-grade account types—savings, goals, and market index
              tracking—so you can teach money the way real accounts behave.
            </p>
            <div className="landing-hero-actions">
              {cloud ? (
                <>
                  <button
                    type="button"
                    className="btn primary btn-lg"
                    onClick={() => openAuthModal('signUp')}
                  >
                    Open family account
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
              Simulation only — not a bank or registered broker-dealer.
            </p>
          </div>
          <LandingProductPreview />
        </section>

        <section className="landing-section landing-section-features">
          <div className="landing-section-head">
            <h2 className="landing-section-title">Built for real family money habits</h2>
            <p className="landing-section-lede">
              Structured like the apps parents already trust—without moving
              actual funds.
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

        <section className="landing-section">
          <div className="landing-section-head">
            <h2 className="landing-section-title">Account products</h2>
            <p className="landing-section-lede">
              Open multiple lines per child—the same icons, colors, and growth
              rules you’ll see inside the app.
            </p>
          </div>
          <ul className="strategy-type-card-grid landing-type-grid">
            {ACCOUNT_TYPE_MODES.map((mode) => {
              const catalog = accountTypeForMode(mode)
              const product = PRODUCT_SPECS[mode]
              return (
                <li
                  key={mode}
                  className={
                    'strategy-type-card strategy-type-card--' +
                    mode +
                    ' strategy-type-card--selected landing-type-card'
                  }
                >
                  <div className="strategy-type-card-top">
                    <span className="strategy-type-card-icon-wrap" aria-hidden>
                      <StrategyTypeCardIcon mode={mode} />
                    </span>
                    <div className="strategy-type-card-heading">
                      <span className="strategy-type-card-title">
                        {catalog.accountName}
                      </span>
                      <span className="strategy-type-card-vibe">
                        {catalog.vibeWord}
                      </span>
                    </div>
                    <span className="landing-product-tag">{product.tag}</span>
                  </div>
                  <span className="landing-product-spec">{product.spec}</span>
                  <span className="strategy-type-card-desc">
                    {GROWTH_MODEL_ONE_LINE[mode]}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="landing-cta">
          <div className="landing-cta-inner">
            <h2 className="landing-cta-title">Start your household portfolio</h2>
            <p>
              Set up children, choose account types, and track balances with
              the same clarity you expect from a custodial brokerage—at your
              kitchen table.
            </p>
            {cloud ? (
              <button
                type="button"
                className="btn primary btn-lg"
                onClick={() => openAuthModal('signUp')}
              >
                Open family account — free
              </button>
            ) : (
              <Link to="/family" className="btn primary btn-lg">
                Open demo
              </Link>
            )}
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p className="landing-footer-brand">Dad Savings Account</p>
        <p className="landing-footer-legal">
          Teaching simulator only. Not financial advice, not FDIC insured, and
          not affiliated with Greenlight, Fidelity, or any financial institution.
        </p>
      </footer>
    </div>
  )
}
