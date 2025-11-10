'use client'

import { useEffect, useState, useCallback } from 'react'
import { forceSessionCheck } from '@/lib/session-manager'

export type PageVisibilityState = 'visible' | 'hidden'

interface UsePageVisibilityOptions {
  onVisibilityChange?: (state: PageVisibilityState) => void
  onPageReturn?: () => void
  validateSessionOnReturn?: boolean
}

/**
 * Hook to detect when user leaves/returns to the page
 * Automatically validates session when user returns
 */
export function usePageVisibility(options: UsePageVisibilityOptions = {}) {
  const {
    onVisibilityChange,
    onPageReturn,
    validateSessionOnReturn = true,
  } = options

  const [isVisible, setIsVisible] = useState(true)
  const [lastVisibleAt, setLastVisibleAt] = useState<number>(Date.now())

  const handleVisibilityChange = useCallback(() => {
    const state = document.visibilityState === 'visible' ? 'visible' : 'hidden'
    const wasHidden = !isVisible

    setIsVisible(state === 'visible')

    if (state === 'visible') {
      const now = Date.now()
      const hiddenDuration = now - lastVisibleAt

      // If page was hidden for more than 1 minute, validate session
      if (wasHidden && hiddenDuration > 60000 && validateSessionOnReturn) {
        console.log(`Page was hidden for ${Math.round(hiddenDuration / 1000)}s, validating session...`)
        forceSessionCheck()
      }

      setLastVisibleAt(now)
      onPageReturn?.()
    } else {
      setLastVisibleAt(Date.now())
    }

    onVisibilityChange?.(state)
  }, [isVisible, lastVisibleAt, onVisibilityChange, onPageReturn, validateSessionOnReturn])

  useEffect(() => {
    // Initial state
    setIsVisible(document.visibilityState === 'visible')

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Also listen for focus/blur as backup
    window.addEventListener('focus', handleVisibilityChange)
    window.addEventListener('blur', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
      window.removeEventListener('blur', handleVisibilityChange)
    }
  }, [handleVisibilityChange])

  return {
    isVisible,
    lastVisibleAt,
  }
}
