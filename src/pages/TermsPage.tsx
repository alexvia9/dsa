import { Link } from 'react-router-dom'
import { LegalDocument } from '../components/LegalDocument'
import { OPERATOR_CONTACT } from '../lib/legalCopy'

export function TermsPage() {
  return (
    <LegalDocument title="Terms of Use" updated="November 6, 2026">
      <p>
        These terms are the agreement between you and the operator of Dad
        Savings Account (“DSA”) for use of the site and the teaching ledger.
        By creating an account, or by clicking that you agree, you accept
        them. If you do not agree, do not use DSA.
      </p>

      <h2>Who may use DSA</h2>
      <p>
        DSA is for a parent or legal guardian who is 18 or older. You enter
        your child’s name and every deposit and withdrawal. Children do not
        create accounts, do not get their own login, and do not type
        information into DSA. You are responsible for keeping your password
        to yourself and for what is entered while you are signed in.
      </p>

      <h2>A teaching ledger, like a savings account or like the market</h2>
      <p>
        DSA tracks pretend balances so a family can practice save, give, and
        spend. You hold all real cash. DSA does not take deposits, move
        money, buy or sell securities, or hold funds for you. A balance that
        grows like a standard savings account (APY) or like a high-yield
        savings account (HYSA) is a rate you chose, applied by the simulator.
        A balance that moves like the S&P 500 applies a daily percentage
        change like the published SPY close-to-close move. The source of that
        published change is Yahoo Finance. DSA uses it only to illustrate a
        pretend balance inside your teaching ledger. DSA does not display
        Yahoo Finance’s chart, offer quotes, or provide a market-data feed,
        and the figure is not for trading or investing. It is not shares of
        SPY, and it can go down. Yahoo Finance provides the information as-is.
        It may be delayed or wrong. Where that day’s published close is not
        available yet, the illustration uses a ~7% yearly teaching estimate
        for that day only. The screen says so next to the total.
      </p>
      <p>
        DSA is not a bank. There is no deposit, so deposit insurance does not
        apply. DSA is not a broker, not an investment adviser, and not a
        money transmitter. Nothing on the site is financial, investment, tax,
        or legal advice. DSA is not affiliated with Yahoo, any bank,
        brokerage, S&P Dow Jones Indices, or the sponsor of SPY.
      </p>

      <h2>You are responsible for the real cash</h2>
      <p>
        Any real money you set aside to match a balance is your cash, in your
        hands. DSA does not owe that money to you or to your child. You
        decide whether the numbers are close enough to use as a teaching
        tool. Figures can be wrong, delayed, rounded, or estimated.
      </p>

      <h2>No warranty</h2>
      <p>
        DSA is provided as-is and as available. The operator does not warrant
        that the ledger, the growth math, the teaching history, or the cloud
        sync will be accurate, complete, uninterrupted, or fit for a
        particular purpose.
      </p>

      <h2>Limit of liability</h2>
      <p>
        DSA is free. To the fullest extent the law allows, the operator is
        not liable for lost cash, lost data, or lost profits, or for
        indirect or consequential damages. The operator’s total liability for
        any claim related to DSA is limited to the greater of $100 or the
        amount you paid the operator for DSA in the 12 months before the
        claim. This limit does not apply where the law does not allow it,
        including liability for fraud or for conduct the law does not let a
        contract waive.
      </p>

      <h2>Your account</h2>
      <p>
        You can delete a child from the family, and you can delete the whole
        account from the Account page. Deleting the account removes the login
        and the family rows tied to it. See the <Link to="/privacy">Privacy
        Policy</Link> for what is stored and for how long.
      </p>

      <h2>Changes</h2>
      <p>
        The operator may update these terms. The date at the top will change.
        If you keep using DSA after an update, you accept the updated terms.
        If you do not accept them, delete the account and stop using the
        site.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms:{' '}
        <a href={OPERATOR_CONTACT}>{OPERATOR_CONTACT}</a>.
      </p>
    </LegalDocument>
  )
}
