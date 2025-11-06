"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export function useBranches() {
  const [branches, setBranches] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBranches() {
      try {
        setLoading(true)
        setError(null)
        
        const { data: branchData, error: fetchError } = await supabase
          .from('expense_details_view')
          .select('branch_name')
          .not('branch_name', 'is', null)

        if (fetchError) {
          console.error('Error fetching branches:', fetchError)
          setError(fetchError.message)
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
  }, [])

  return { branches, loading, error }
}