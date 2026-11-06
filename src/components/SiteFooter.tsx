import { Link } from 'react-router-dom'
import { FOOTER_LEGAL } from '../lib/legalCopy'

export function SiteFooter() {
  return (
    <footer className="landing-footer site-footer">
      <p className="landing-footer-brand">Dad Savings Account</p>
      <p className="landing-footer-legal">{FOOTER_LEGAL}</p>
      <p className="site-footer-links">
        <Link to="/terms">Terms of Use</Link>
        <span aria-hidden="true"> · </span>
        <Link to="/privacy">Privacy Policy</Link>
      </p>
    </footer>
  )
}
