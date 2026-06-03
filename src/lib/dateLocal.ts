/** Local calendar date YYYY-MM-DD (for deposit stamps). */
export function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseLocalDateString(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return null
  }
  return dt
}

export function addLocalCalendarDays(ymd: string, deltaDays: number): string {
  const d = parseLocalDateString(ymd)
  if (!d) return ymd
  d.setDate(d.getDate() + deltaDays)
  return localDateString(d)
}

export function addLocalCalendarMonths(ymd: string, deltaMonths: number): string {
  const d = parseLocalDateString(ymd)
  if (!d) return ymd
  d.setMonth(d.getMonth() + deltaMonths)
  return localDateString(d)
}

export function addLocalCalendarYears(ymd: string, deltaYears: number): string {
  const d = parseLocalDateString(ymd)
  if (!d) return ymd
  d.setFullYear(d.getFullYear() + deltaYears)
  return localDateString(d)
}

/**
 * Pads month/day to match calendar keys from {@link eachCalendarDay}-style loops
 * (`YYYY-MM-DD`). Fixes deposits saved as `2026-2-18` not matching `2026-02-18`.
 */
export function toCanonicalLocalYmd(raw: string): string {
  const t = raw.trim()
  if (!t) return t
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const d = parseLocalDateString(t)
    return d ? localDateString(d) : t
  }
  const m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!m) return t
  const y = Number(m[1])
  const mo = Number(m[2])
  const day = Number(m[3])
  const dt = new Date(y, mo - 1, day)
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== mo - 1 ||
    dt.getDate() !== day
  ) {
    return t
  }
  return localDateString(dt)
}
