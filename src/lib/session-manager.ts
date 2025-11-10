/**
 * Session management utilities
 * Handles session validation, refresh, and expiration detection
 */

import { supabase } from './supabase'

export type SessionStatus = 'active' | 'expired' | 'invalid' | 'checking'

let lastSessionCheck = 0
const SESSION_CHECK_INTERVAL = 60000 // Check every 60 seconds max

/**
 * Check if the current session is valid
 * Cached for performance - only checks once per minute
 */
export async function validateSession(): Promise<{
  valid: boolean
  status: SessionStatus
  error?: string
}> {
  const now = Date.now()

  // Don't check too frequently
  if (now - lastSessionCheck < SESSION_CHECK_INTERVAL) {
    return { valid: true, status: 'active' }
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    lastSessionCheck = now

    if (error) {
      console.error('Session validation error:', error)
      return {
        valid: false,
        status: 'invalid',
        error: error.message,
      }
    }

    if (!session) {
      return {
        valid: false,
        status: 'expired',
        error: 'Session has expired',
      }
    }

    // Check if token is about to expire (within 5 minutes)
    const expiresAt = session.expires_at
    if (expiresAt) {
      const expiresInMs = expiresAt * 1000 - now
      if (expiresInMs < 300000) {
        // Less than 5 minutes
        console.warn('Session expires soon, attempting refresh...')
        await refreshSession()
      }
    }

    return { valid: true, status: 'active' }
  } catch (error) {
    console.error('Session validation failed:', error)
    return {
      valid: false,
      status: 'invalid',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Refresh the current session
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.refreshSession()

    if (error || !data.session) {
      console.error('Session refresh failed:', error)
      return false
    }

    lastSessionCheck = Date.now()
    return true
  } catch (error) {
    console.error('Session refresh error:', error)
    return false
  }
}

/**
 * Force a session check (bypasses cache)
 */
export function forceSessionCheck(): void {
  lastSessionCheck = 0
}
