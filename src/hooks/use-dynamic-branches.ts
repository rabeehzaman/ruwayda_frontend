"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { DateRange } from "@/components/dashboard/date-filter"
import { format } from "date-fns"

export function useDynamicBranches(dateRange?: DateRange) {
  const [branches, setBranches] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBranches() {
      try {
        setLoading(true)
        setError(null)
        
        let query = supabase
          .from('expense_details_view')
          .select('branch_name')
          .not('branch_name', 'is', null)

        // Apply date range filter if provided
        if (dateRange?.from && dateRange.from instanceof Date) {
          try {
            const fromDate = format(dateRange.from, 'yyyy-MM-dd')
            query = query.gte('date', fromDate)
          } catch (err) {
            console.error('Error formatting from date:', dateRange.from, err)
          }
        }
        
        if (dateRange?.to && dateRange.to instanceof Date) {
          try {
            const toDate = format(dateRange.to, 'yyyy-MM-dd')
            query = query.lte('date', toDate)
          } catch (err) {
            console.error('Error formatting to date:', dateRange.to, err)
          }
        }

        const { data: branchData, error: fetchError } = await query

        if (fetchError) {
          console.error('Error fetching branches from expense_details_view:', fetchError)
          console.error('Full error details:', JSON.stringify(fetchError, null, 2))
          setError(`Failed to load branches: ${fetchError.message}`)
          return
        }

        // Get unique branch names and add "All" option
        const uniqueBranches = Array.from(
          new Set(branchData?.map(item => item.branch_name) || [])
        ).sort()
        
        setBranches(['All', ...uniqueBranches])
      } catch (err) {
        console.error('Error in fetchBranches:', err)
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchBranches()
  }, [dateRange?.from?.getTime(), dateRange?.to?.getTime()])

  return { branches, loading, error }
}