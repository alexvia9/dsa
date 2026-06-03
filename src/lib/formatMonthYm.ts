/** `YYYY-MM` → long month + year for display (local calendar month). */
export function formatMonthYearLabel(ym: string): string {
  const parts = ym.split('-').map(Number)
  if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n))) return ym
  const [y, m] = parts
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(y, m - 1, 1))
}
