'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { usePageVisibility } from '@/hooks/use-page-visibility'
import { useIdleDetection } from '@/hooks/use-idle-detection'
import { validateSession, refreshSession } from '@/lib/session-manager'

/**
 * Global session monitor component
 * Handles session validation, idle detection, and user notifications
 */
export function SessionMonitor() {
  const router = useRouter()
  const hasShownIdleWarning = useRef(false)
  const isValidating = useRef(false)

  // Handle page visibility changes
  const handlePageReturn = useCallback(async () => {
    if (isValidating.current) return

    console.log('User returned to page, validating session...')
    isValidating.current = true

    try {
      const { valid, status, error } = await validateSession()

      if (!valid) {
        if (status === 'expired') {
          toast.error('Session Expired', {
            description: 'Your session has expired. Please refresh the page.',
            action: {
              label: 'Refresh',
              onClick: () => router.refresh(),
            },
            duration: 10000,
          })
        } else {
          toast.error('Session Error', {
            description: error || 'There was an issue with your session.',
            duration: 5000,
          })
        }
      } else {
        console.log('Session validated successfully')
      }
    } catch (error) {
      console.error('Session validation error:', error)
    } finally {
      isValidating.current = false
    }
  }, [router])

  usePageVisibility({
    onPageReturn: handlePageReturn,
    validateSessionOnReturn: true,
  })

  // Handle idle detection
  const handleIdle = useCallback(() => {
    if (hasShownIdleWarning.current) return

    console.log('User is idle, checking session...')
    hasShownIdleWarning.current = true

    validateSession().then(({ valid, status }) => {
      if (!valid) {
        toast.warning('Inactive Session', {
          description: 'You have been inactive. Your session may have expired.',
          action: {
            label: 'Refresh',
            onClick: () => {
              router.refresh()
              hasShownIdleWarning.current = false
            },
          },
          duration: 10000,
        })
      }
    })
  }, [router])

  const handleActive = useCallback(() => {
    hasShownIdleWarning.current = false
  }, [])

  useIdleDetection({
    idleTime: 300000, // 5 minutes
    onIdle: handleIdle,
    onActive: handleActive,
  })

  // Periodic session refresh (every 10 minutes)
  useEffect(() => {
    const interval = setInterval(async () => {
      console.log('Periodic session refresh...')
      const refreshed = await refreshSession()

      if (!refreshed) {
        console.warn('Session refresh failed')
      }
    }, 600000) // 10 minutes

    return () => clearInterval(interval)
  }, [])

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => {
      toast.success('Back Online', {
        description: 'Your connection has been restored.',
        duration: 3000,
      })

      // Validate session when coming back online
      validateSession()
    }

    const handleOffline = () => {
      toast.error('Connection Lost', {
        description: 'You are currently offline. Some features may not work.',
        duration: 5000,
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return null // This component doesn't render anything
}
