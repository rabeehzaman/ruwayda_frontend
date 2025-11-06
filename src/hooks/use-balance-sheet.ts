"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { DateRange } from "@/components/dashboard/date-filter"

export interface BalanceSheetData {
  totalReceivables: number
  totalStock: number
  totalAssets: number
  totalVendorPayable: number
  totalLiabilities: number
  netWorth: number
}

export function useBalanceSheet(dateRange?: DateRange, branchFilter?: string) {
  const [data, setData] = useState<BalanceSheetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBalanceSheetData() {
      try {
        setLoading(true)
        setError(null)

        // Build queries with branch filtering
        let receivablesQuery = supabase
          .from('customer_balance_aging')
          .select('total_balance, customer_owner_name_custom')
        
        let stockQuery = supabase
          .from('zoho_stock_summary')
          .select('"Current Stock Value", "Warehouse"')
        
        // Apply branch filtering
        if (branchFilter && branchFilter !== "All") {
          if (branchFilter === "Team A") {
            // Team A: All customer owners except "Shibili S man" and "Shibili TRn"
            receivablesQuery = receivablesQuery
              .not('customer_owner_name_custom', 'in', '(Shibili S man,Shibili TRn)')
            
            // Team A: All warehouses except "SEB VEHICLE WH"
            stockQuery = stockQuery
              .neq('"Warehouse"', 'SEB VEHICLE WH')
              
          } else if (branchFilter === "Team B") {
            // Team B: Only "Shibili S man" and "Shibili TRn" customer owners
            receivablesQuery = receivablesQuery
              .in('customer_owner_name_custom', ['Shibili S man', 'Shibili TRn'])
            
            // Team B: Only "SEB VEHICLE WH"
            stockQuery = stockQuery
              .eq('"Warehouse"', 'SEB VEHICLE WH')
          }
        }

        // Fetch all data in parallel
        const [receivablesResult, stockResult, payablesResult] = await Promise.all([
          receivablesQuery,
          stockQuery,
          // Vendor payables - no branch filtering mentioned, so keeping all
          supabase
            .from('vendor_balance_aging_view')
            .select('"Total Outstanding"')
        ])

        if (receivablesResult.error) {
          throw new Error(`Receivables error: ${receivablesResult.error.message}`)
        }
        
        if (stockResult.error) {
          throw new Error(`Stock error: ${stockResult.error.message}`)
        }
        
        if (payablesResult.error) {
          throw new Error(`Payables error: ${payablesResult.error.message}`)
        }

        // Calculate totals
        const totalReceivables = (receivablesResult.data || [])
          .reduce((sum, item) => sum + (parseFloat(item.total_balance) || 0), 0)
          
        const totalStock = (stockResult.data || [])
          .reduce((sum, item) => {
            const value = parseFloat(item['Current Stock Value']) || 0
            return sum + (value > 0 ? value : 0) // Only positive stock values
          }, 0)
          
        const totalVendorPayable = (payablesResult.data || [])
          .reduce((sum, item) => sum + (parseFloat(item['Total Outstanding']) || 0), 0)
        
        const totalAssets = totalReceivables + totalStock
        const totalLiabilities = totalVendorPayable
        const netWorth = totalAssets - totalLiabilities

        setData({
          totalReceivables,
          totalStock,
          totalAssets,
          totalVendorPayable,
          totalLiabilities,
          netWorth
        })

      } catch (err) {
        console.error('Error fetching balance sheet data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load balance sheet data')
      } finally {
        setLoading(false)
      }
    }

    fetchBalanceSheetData()
  }, [dateRange, branchFilter])

  return { data, loading, error }
}