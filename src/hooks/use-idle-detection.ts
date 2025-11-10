'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

interface UseIdleDetectionOptions {
  idleTime?: number // Time in ms before considered idle (default: 5 minutes)
  onIdle?: () => void
  onActive?: () => void
  events?: string[] // Events to listen for user activity
}

const DEFAULT_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click',
]

/**
 * Hook to detect user idle state
 * Triggers callback when user has been inactive for specified time
 */
export function useIdleDetection(options: UseIdleDetectionOptions = {}) {
  const {
    idleTime = 300000, // 5 minutes default
    onIdle,
    onActive,
    events = DEFAULT_EVENTS,
  } = options

  const [isIdle, setIsIdle] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastActivityRef = useRef<number>(Date.now())

  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now()

    if (isIdle) {
      setIsIdle(false)
      onActive?.()
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setIsIdle(true)
      onIdle?.()
    }, idleTime)
  }, [isIdle, idleTime, onIdle, onActive])

  useEffect(() => {
    // Initial timeout
    handleActivity()

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity)
    })

    return () => {
      // Cleanup
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [events, handleActivity])

  const getIdleDuration = useCallback(() => {
    return Date.now() - lastActivityRef.current
  }, [])

  return {
    isIdle,
    lastActivityAt: lastActivityRef.current,
    getIdleDuration,
  }
}
