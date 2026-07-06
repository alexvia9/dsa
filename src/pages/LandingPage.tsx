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
  piggy_bank: { spec: '0% · cash only', tag: 'Spend' },
  savings_apr: { spec: 'Fixed APY · daily accrual', tag: 'Save' },
  monthly_end_compound: { spec: 'Custom % · month-end', tag: 'Give' },
  stock_market: { spec: 'S&P 500 · SPY daily', tag: 'Invest' },
}

const FEATURES = [
  {
    title: 'All jars in one view',
    body: 'See spend, save, give, and invest for every child—no more counting cash across the counter or digging through envelopes.',
  },
  {
    title: 'Quick to update',
    body: 'Log allowance or a purchase in seconds when money moves. Balances stay current without spreadsheets or mental math.',
  },
  {
    title: 'Growth, calculated for you',
    body: 'Interest and market moves update automatically so you and your kids can see progress—not just the last deposit.',
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
              <li>Save · spend · give · invest</li>
            </ul>
            <h1 className="landing-headline">
              The simple way to track your kids&apos; money
            </h1>
            <p className="landing-lede">
              DSA replaces piggy banks and envelope jars with one clear view. You
              still hold the cash—we just make it easier to see what each child
              has for spending, saving, giving, and investing. A teaching tool
              that saves you the hassle, not another account to manage.
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
              through DSA.
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

        <section className="landing-section">
          <div className="landing-section-head">
            <h2 className="landing-section-title">Four jars, zero clutter</h2>
            <p className="landing-section-lede">
              The same Moonjar or envelope split you already use—digital, per
              child, and always easy to check.
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

      <footer className="landing-footer">
        <p className="landing-footer-brand">Dad Savings Account</p>
        <p className="landing-footer-legal">
          Teaching simulator only. You hold all real money; DSA does not. Not
          financial advice, not FDIC insured, and not affiliated with any bank
          or brokerage.
        </p>
      </footer>
    </div>
  )
}
