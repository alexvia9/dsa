import { Link } from 'react-router-dom'
import { LegalDocument } from '../components/LegalDocument'
import { OPERATOR_CONTACT } from '../lib/legalCopy'

export function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy" updated="November 6, 2026">
      <p>
        This policy describes what Dad Savings Account (“DSA”) collects, why,
        how long it is kept, and how to delete it. DSA is a teaching ledger
        for a parent or legal guardian. It is not directed to children as
        account holders. A child does not create an account and does not
        enter information. The parent types the child’s name and the ledger.
      </p>

      <h2>Who this covers</h2>
      <p>
        The account holder is a parent or legal guardian 18 or older. If a
        child is using a parent’s signed-in session, that is the parent’s
        session. If we learn that a child under 13 created an account, we
        will delete that account and the family rows tied to it. Contact us
        and we will do that.
      </p>

      <h2>Information from the parent</h2>
      <ul>
        <li>Email address and password, used to sign in. The password is stored by the sign-in provider, not as plain text in the family tables.</li>
        <li>The child’s name, as the parent types it. A first name is enough.</li>
        <li>An avatar color the parent picks.</li>
        <li>Account names, growth settings (including a rate like an APY, a month-end cap, or a like-the-market illustration), balances, and ledger lines: deposits, withdrawals, dates, and any note the parent types.</li>
      </ul>
      <p>
        Do not put a child’s full legal name, school, address, or other
        sensitive details in a note. The ledger does not need them.
      </p>

      <h2>Information collected automatically</h2>
      <p>
        The host that serves the site (GitHub Pages) and the database host
        (Supabase) receive standard connection data such as IP address, as
        part of operating the service. DSA does not run advertising or
        analytics pixels. Fonts are served with the site, not from a third-party
        font service. For a balance that moves like the market, our server
        requests the published SPY daily chart from Yahoo Finance solely to
        compute a percentage change for a pretend balance. DSA does not
        display that chart, offer those figures as quotes, or provide a
        market-data feed. The request does not include the parent’s email,
        the child’s name, or the ledger.
      </p>
      <p>
        On a device that uses the demo without signing in, the family ledger
        stays in that browser’s local storage. It is not sent to the cloud
        until you sign in with cloud sign-in configured.
      </p>

      <h2>Why it is collected</h2>
      <p>
        To create the parent’s login, to show the family the parent set up,
        to calculate the simulated balances, and to keep that ledger available
        on the parent’s devices after sign-in. We do not sell personal
        information. We do not use it for advertising.
      </p>

      <h2>Who else handles it</h2>
      <ul>
        <li>Supabase, for sign-in and for the database that stores the family rows when you use a cloud account.</li>
        <li>GitHub Pages, for hosting the website.</li>
        <li>Yahoo Finance, as the source of the published SPY daily percentage change used only inside the teaching simulation. That request does not include the family rows, and DSA does not offer Yahoo Finance’s information as a quote service.</li>
      </ul>
      <p>
        Supabase and GitHub Pages process that information to run DSA. The
        Yahoo request is only for the published SPY chart, used to simulate
        a pretend balance. We do not give family rows to other companies for
        their own marketing.
      </p>

      <h2>How long it is kept</h2>
      <p>
        Parent and child information is kept while the account is open, so
        the parent can see the teaching history they asked for. It is not
        kept indefinitely.
      </p>
      <ul>
        <li>Removing a child deletes that child’s profile, accounts, and ledger rows.</li>
        <li>Deleting the account on the Account page deletes the login and the family rows tied to it. We do not keep a copy of those rows after deletion.</li>
        <li>A browser’s local demo data stays on that device until the parent clears site data for DSA, or deletes the cloud account on that same browser (which clears the local copy as well).</li>
      </ul>
      <p>
        This is the retention policy for information the parent enters about
        a child: collected to run the teaching ledger the parent requested,
        retained only while that ledger is open, and deleted when the parent
        removes the child or deletes the account.
      </p>

      <h2>How it is protected</h2>
      <p>
        Family rows in the cloud are readable and writable only by the signed-in
        parent (row-level security). The browser uses the public sign-in key,
        not a database admin key. Traffic uses HTTPS. Access to the production
        database is limited to the operator’s hosting account. This is a small
        project: one operator, the family data each parent enters, and the two
        processors named above.
      </p>

      <h2>Your choices</h2>
      <p>
        You can review and edit the child’s name, the ledger, and your email
        and password while signed in. You can remove a child, or delete the
        whole account, from the Account page. You can also contact us to ask
        for deletion.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions and deletion requests:{' '}
        <a href={OPERATOR_CONTACT}>{OPERATOR_CONTACT}</a>. The terms that go
        with this policy are the <Link to="/terms">Terms of Use</Link>.
      </p>
    </LegalDocument>
  )
}
