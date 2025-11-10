/**
 * Centralized error handling utilities
 * Converts errors to user-friendly messages
 */

import { toast } from 'sonner'

export type ErrorType =
  | 'network'
  | 'timeout'
  | 'auth'
  | 'validation'
  | 'server'
  | 'unknown'

export interface AppError {
  type: ErrorType
  message: string
  details?: string
  code?: string
}

/**
 * Parse Supabase error into AppError
 */
export function parseSupabaseError(error: any): AppError {
  if (!error) {
    return {
      type: 'unknown',
      message: 'An unknown error occurred',
    }
  }

  // Timeout error
  if (error.code === 'REQUEST_TIMEOUT') {
    return {
      type: 'timeout',
      message: 'Request timed out',
      details: 'The server took too long to respond. Please try again.',
      code: error.code,
    }
  }

  // Auth errors
  if (error.message?.includes('JWT') || error.message?.includes('auth') || error.status === 401) {
    return {
      type: 'auth',
      message: 'Authentication error',
      details: 'Your session may have expired. Please refresh the page.',
      code: error.code,
    }
  }

  // Network errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return {
      type: 'network',
      message: 'Connection error',
      details: 'Please check your internet connection and try again.',
      code: error.code,
    }
  }

  // Server errors
  if (error.status >= 500) {
    return {
      type: 'server',
      message: 'Server error',
      details: 'Something went wrong on our end. Please try again later.',
      code: error.code,
    }
  }

  // Validation errors
  if (error.status === 400 || error.status === 422) {
    return {
      type: 'validation',
      message: 'Invalid request',
      details: error.message || 'Please check your input and try again.',
      code: error.code,
    }
  }

  return {
    type: 'unknown',
    message: error.message || 'An error occurred',
    details: error.details,
    code: error.code,
  }
}

/**
 * Show error toast to user
 */
export function showErrorToast(error: any, customMessage?: string) {
  const appError = parseSupabaseError(error)

  toast.error(customMessage || appError.message, {
    description: appError.details,
    duration: appError.type === 'auth' ? 10000 : 5000,
    action:
      appError.type === 'auth'
        ? {
            label: 'Refresh',
            onClick: () => window.location.reload(),
          }
        : undefined,
  })

  // Log to console for debugging
  console.error('Error:', appError, 'Original:', error)
}

/**
 * Check if error is a session expiration error
 */
export function isSessionExpiredError(error: any): boolean {
  if (!error) return false

  return (
    error.status === 401 ||
    error.message?.includes('JWT') ||
    error.message?.includes('expired') ||
    error.message?.includes('unauthorized')
  )
}
