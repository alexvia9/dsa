import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement> & {
  variant?: 'green' | 'navy'
}

/** Pig snout + curly tail — solo mark (letters live beside this in the header). */
export function DsaLogoMark({
  variant = 'green',
  className,
  ...props
}: Props) {
  const tile = variant === 'navy' ? '#0c2340' : '#00a651'
  const ink = variant === 'navy' ? '#163556' : '#008542'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-hidden
      className={className}
      {...props}
    >
      <rect width="40" height="40" rx="9" fill={tile} />

      {/* Curly tail */}
      <path
        d="M 14 28.5
           C 8 26, 7 16, 14.5 11
           C 22 6, 32 9, 33.5 17.5
           C 34.8 24, 29 29, 22.5 27
           C 18.5 25.5, 17.5 21, 21 18"
        stroke="#fff"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Snout */}
      <ellipse cx="13.5" cy="29.5" rx="7" ry="5.25" fill="#fff" />
      <ellipse
        cx="13.5"
        cy="29.5"
        rx="7"
        ry="5.25"
        stroke={ink}
        strokeWidth="1.1"
        fill="none"
      />
      <ellipse cx="10.35" cy="29.1" rx="1.5" ry="2" fill={ink} />
      <ellipse cx="16.65" cy="29.1" rx="1.5" ry="2" fill={ink} />
    </svg>
  )
}

/** D$A wordmark for use beside the pig mark. */
export function DsaMonogram({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden>
      D$A
    </span>
  )
}
