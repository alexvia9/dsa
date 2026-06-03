import type { Kid } from '../types/dsa'

/** Multi-child household dashboard — hidden for 0 or 1 child. */
export function showFamilyOverview(kidCount: number): boolean {
  return kidCount >= 2
}

/** Primary in-app destination after sign-in or logo tap. */
export function homeAppPath(kids: Pick<Kid, 'id'>[]): string {
  if (kids.length === 0) return '/family'
  if (kids.length === 1) return `/kids/${kids[0]!.id}`
  return '/family'
}
