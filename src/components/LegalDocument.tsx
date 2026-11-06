import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { pageTitle, usePageTitle } from '../lib/pageTitle'
import { DsaLogoMark, DsaMonogram } from './DsaLogoMark'
import { SiteFooter } from './SiteFooter'

type Props = {
  title: string
  updated: string
  children: ReactNode
}

export function LegalDocument({ title, updated, children }: Props) {
  usePageTitle(pageTitle(title))

  return (
    <div className="legal-shell">
      <header className="site-header legal-header">
        <Link to="/" className="brand-link">
          <DsaLogoMark className="brand-mark" variant="green" />
          <DsaMonogram className="brand-monogram" />
          <span className="brand-text">
            <span className="brand-title">Dad Savings Account</span>
            <span className="brand-tagline">Kids&apos; money, one place</span>
          </span>
        </Link>
      </header>
      <main className="site-main legal-main">
        <h1>{title}</h1>
        <p className="muted small legal-updated">Updated {updated}</p>
        <div className="legal-prose">{children}</div>
      </main>
      <SiteFooter />
    </div>
  )
}
