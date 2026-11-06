import { AddChildFlow } from '../components/AddChildFlow'
import { AccountTypesOverview } from '../components/AccountTypesOverview'
import { pageTitle, usePageTitle } from '../lib/pageTitle'

export function FamilySetupPage() {
  usePageTitle(pageTitle('Add a child'))

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
              withdrawals you control—so they can compare a piggy bank with
              month-end growth on save, give, and spend. You enter their name.
              Children do not have logins.
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
        lede="Save, give, and spend jars. Compare a piggy bank with month-end, and open accounts that grow like savings or like the market whenever you want."
      />
    </div>
  )
}
