/**
 * Account-type icons — Lucide geometry (ISC), unified 2px stroke.
 * @see https://lucide.dev
 */
import type { JSX, ReactNode, SVGProps } from 'react'
import type { InvestmentStrategy } from '../../types/dsa'

type StrategyMode = InvestmentStrategy['mode']

const strokeIconProps: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function StrokeIcon({ children }: { children: ReactNode }) {
  return (
    <svg {...strokeIconProps} aria-hidden>
      {children}
    </svg>
  )
}

function IconPiggyBank() {
  return (
    <StrokeIcon>
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" />
      <path d="M2 9v1c0 1.1.9 2 2 2h1" />
      <path d="M16 11h.01" />
    </StrokeIcon>
  )
}

function IconSavings() {
  return (
    <StrokeIcon>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </StrokeIcon>
  )
}

function IconMonthEnd() {
  return (
    <StrokeIcon>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </StrokeIcon>
  )
}

function IconMarketIndex() {
  return (
    <StrokeIcon>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m19 9-5 5-4-4-3 3" />
    </StrokeIcon>
  )
}

const ICON_BY_MODE: Record<StrategyMode, () => JSX.Element> = {
  piggy_bank: IconPiggyBank,
  savings_apr: IconSavings,
  monthly_end_compound: IconMonthEnd,
  stock_market: IconMarketIndex,
}

export function StrategyTypeCardIcon({ mode }: { mode: StrategyMode }) {
  const Icon = ICON_BY_MODE[mode]
  return <Icon />
}
