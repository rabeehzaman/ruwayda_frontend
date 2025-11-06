"use client"

import { useState, useEffect } from 'react'
import { getActiveBranches } from '@/lib/database-optimized'
import type { DateRange } from '@/components/dashboard/date-filter'

export function useActiveBranches(dateRange?: DateRange) {
  const [branches, setBranches] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetchActiveBranches() {
      try {
        setLoading(true)
        setError(null)
        
        const activeBranches = await getActiveBranches(
          dateRange?.from,
          dateRange?.to
        )
        
        if (mounted) {
          setBranches(activeBranches)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch active branches')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchActiveBranches()

    return () => {
      mounted = false
    }
  }, [dateRange?.from, dateRange?.to])

  return {
    branches,
    loading,
    error
  }
}