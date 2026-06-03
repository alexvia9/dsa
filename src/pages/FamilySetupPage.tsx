import { AddChildFlow } from '../components/AddChildFlow'
import { AccountTypesOverview } from '../components/AccountTypesOverview'

export function FamilySetupPage() {
  return (
    <div className="page family-setup-page" lang="en">
      <section
        className="family-setup-add-panel"
        aria-labelledby="family-setup-add-title"
        aria-describedby="family-setup-add-desc"
      >
        <div className="family-setup-add-grid">
          <div className="family-setup-add-main">
            <h1 id="family-setup-add-title" className="family-setup-hero-title">
              Add a child to start teaching
            </h1>
            <p id="family-setup-add-desc" className="family-setup-add-lede">
              Set up their profile, then open accounts and log deposits and
              withdrawals you control—so they learn how saving, spending, and
              investing really work.
            </p>
            <AddChildFlow
              variant="standalone"
              ctaLabel="Add your first child"
            />
          </div>
          <div className="family-setup-add-visual" aria-hidden>
            <div className="family-setup-add-visual-card">
              <span className="family-setup-add-visual-icon">+</span>
              <span className="family-setup-add-visual-label">
                First profile
              </span>
            </div>
          </div>
        </div>
      </section>

      <AccountTypesOverview
        variant="landing"
        title="What you'll set up on their page"
        lede="Spending jars, savings, goals, and market-style lines—the same account types you&apos;ll use to teach as they grow."
      />
    </div>
  )
}
