import { useEffect } from 'react'

export const APP_TITLE = 'Dad Savings Account'

export function pageTitle(page: string): string {
  return `${page} · ${APP_TITLE}`
}

/**
 * Sets the browser tab title for the current view.
 * Pass null to leave the title alone (a parent shell rendering its children).
 */
export function usePageTitle(title: string | null) {
  useEffect(() => {
    if (title === null) return
    document.title = title
  }, [title])
}
