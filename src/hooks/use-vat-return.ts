"use client"

import { useState, useEffect } from "react"
import { getVATReturn, formatDateForRPC, type VATReturnData } from "@/lib/database-optimized"
import type { DateRange } from "@/components/dashboard/date-filter"

export function useVATReturn(dateRange?: DateRange, locationIds?: string[]) {
  const [data, setData] = useState<VATReturnData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchVATReturn() {
      try {
        setLoading(true)
        setError(null)

        // Pass all selected location names to RPC function (supports multiple locations)
        const branchFilters = locationIds && locationIds.length > 0 ? locationIds : undefined

        // Format dates for RPC call - use current month if no dates provided
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        const startDate = dateRange?.from ? formatDateForRPC(dateRange.from) : formatDateForRPC(firstDayOfMonth)
        const endDate = dateRange?.to ? formatDateForRPC(dateRange.to) : formatDateForRPC(lastDayOfMonth)

        console.log('📊 Loading VAT return:', { startDate, endDate, locationIds, branchFilters })

        const result = await getVATReturn(startDate, endDate, branchFilters)

        if (result) {
          setData(result)
          console.log('✅ VAT return loaded successfully')
        } else {
          setError('Failed to load VAT return data')
          console.error('❌ VAT return loading failed')
        }
      } catch (err) {
        console.error('❌ Error loading VAT return:', err)
        setError('Failed to load VAT return data')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchVATReturn()
  }, [dateRange?.from?.getTime(), dateRange?.to?.getTime(), locationIds])

  return { data, loading, error }
}
