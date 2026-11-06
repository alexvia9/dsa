import { getSupabase } from './supabaseClient'

const ackKey = (userId: string) => `dsa-legal-ack:${userId}`
const SIGNUP_PENDING_KEY = 'dsa-legal-signup-pending'

export function markSignupLegalPending(email: string): void {
  sessionStorage.setItem(SIGNUP_PENDING_KEY, email.trim().toLowerCase())
}

export function hasLocalLegalAck(userId: string): boolean {
  return localStorage.getItem(ackKey(userId)) === '1'
}

export function clearLegalAck(userId: string): void {
  localStorage.removeItem(ackKey(userId))
}

/** True when this browser just collected the signup checkboxes for this email. */
export function consumeSignupLegalPending(email: string | undefined): boolean {
  if (!email) return false
  const pending = sessionStorage.getItem(SIGNUP_PENDING_KEY)
  if (!pending || pending !== email.trim().toLowerCase()) return false
  sessionStorage.removeItem(SIGNUP_PENDING_KEY)
  return true
}

async function readRemoteLegalAck(userId: string): Promise<boolean> {
  const supabase = getSupabase()
  if (!supabase) return false
  const { data, error } = await supabase
    .from('dsa_parent_ack')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return false
  return true
}

export async function parentHasLegalAck(
  userId: string,
  email: string | undefined,
): Promise<boolean> {
  if (consumeSignupLegalPending(email)) {
    await recordLegalAck(userId)
    return true
  }
  if (await readRemoteLegalAck(userId)) {
    localStorage.setItem(ackKey(userId), '1')
    return true
  }
  return hasLocalLegalAck(userId)
}

export async function recordLegalAck(userId: string): Promise<void> {
  localStorage.setItem(ackKey(userId), '1')
  const supabase = getSupabase()
  if (!supabase) return
  const { error } = await supabase.from('dsa_parent_ack').upsert({
    user_id: userId,
    terms_accepted_at: new Date().toISOString(),
    is_adult_guardian: true,
  })
  if (error) {
    console.error('[DSA] Could not store terms acceptance', error)
  }
}
