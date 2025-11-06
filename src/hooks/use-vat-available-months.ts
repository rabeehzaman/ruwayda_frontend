"use client"

import { useState, useEffect } from "react"
import { getVATAvailableMonths, type VATAvailableMonth } from "@/lib/database-optimized"

export function useVATAvailableMonths() {
  const [months, setMonths] = useState<VATAvailableMonth[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAvailableMonths() {
      try {
        setLoading(true)
        setError(null)

        console.log('📅 Loading available VAT months')

        const result = await getVATAvailableMonths()

        if (result) {
          setMonths(result)
          console.log('✅ Available VAT months loaded successfully:', result.length)
        } else {
          setError('Failed to load available months')
          console.error('❌ Available VAT months loading failed')
        }
      } catch (err) {
        console.error('❌ Error loading available VAT months:', err)
        setError('Failed to load available months')
        setMonths([])
      } finally {
        setLoading(false)
      }
    }

    fetchAvailableMonths()
  }, []) // Only fetch once on mount

  return { months, loading, error }
}
