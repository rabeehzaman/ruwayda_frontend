"use client"

import { useState, useEffect } from 'react'
import type { ProfitAnalysisViewCurrent } from '@/types/database'
import { 
  fetchProfitAnalysisData, 
  fetchProfitAnalysisDataByDateRange,
  getMockProfitAnalysisData,
  calculateDashboardKPIs 
} from '@/lib/data-fetching'
import { 
  fetchKPIsHybrid,
  fetchPaginatedTransactions,
  getPerformanceMetrics,
  type OptimizedKPIs
} from '@/lib/optimized-data-fetching'
import { formatDateLocal } from '@/lib/utils'
import type { DateRange } from '@/components/dashboard/date-filter'

export function useProfitAnalysisData(dateRange?: DateRange, branchFilter?: string) {
  const [data, setData] = useState<ProfitAnalysisViewCurrent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        
        // Try to fetch real data first, fall back to mock data if needed
        let result: ProfitAnalysisViewCurrent[]
        
        if (dateRange) {
          // Format dates for API
          const startDate = formatDateLocal(dateRange.from)
          const endDate = formatDateLocal(dateRange.to)
          result = await fetchProfitAnalysisDataByDateRange(startDate, endDate)
        } else {
          result = await fetchProfitAnalysisData()
        }

        // Apply branch filter if specified
        if (branchFilter && result) {
          result = result.filter(item => item['Branch Name'] === branchFilter)
        }
        
        // If no data from Supabase, don't use mock data - show empty state
        if (!result || result.length === 0) {
          console.log('⚠️ No data from Supabase - showing empty state (no fallback to mock data)')
          result = []
        }
        
        setData(result)
      } catch (err) {
        console.error('Error loading profit analysis data:', err)
        setError('Failed to load data')
        // Don't use mock data as fallback - show empty state
        setData([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [dateRange, branchFilter])

  const refetch = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let result: ProfitAnalysisViewCurrent[]
      
      if (dateRange) {
        const startDate = formatDateLocal(dateRange.from)
        const endDate = formatDateLocal(dateRange.to)
        result = await fetchProfitAnalysisDataByDateRange(startDate, endDate)
      } else {
        result = await fetchProfitAnalysisData()
      }

      // Apply branch filter if specified
      if (branchFilter && result) {
        result = result.filter(item => item['Branch Name'] === branchFilter)
      }
      
      if (!result || result.length === 0) {
        result = []
      }
      
      setData(result)
    } catch (err) {
      console.error('Error refetching data:', err)
      setError('Failed to refetch data')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch }
}

export function useDashboardKPIs(
  data?: ProfitAnalysisViewCurrent[], 
  dateRange?: DateRange,
  branchFilter?: string
) {
  const [kpis, setKpis] = useState<OptimizedKPIs>({
    totalRevenue: 0,
    totalProfit: 0,
    profitMargin: 0,
    taxableSales: 0,
    totalQuantity: 0,
    totalCost: 0,
    averageOrderValue: 0,
    totalInvoices: 0,
    grossProfit: 0,
    grossProfitPercentage: 0,
    totalStockValue: 0,
    dailyAvgSales: 0,
    totalPayables: 0,
    visits: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOptimized, setIsOptimized] = useState(false)

  useEffect(() => {
    async function loadKPIs() {
      try {
        setLoading(true)
        setError(null)
        
        // IMPORTANT: Never use provided data for KPI calculation as it's limited to 1000 records
        // Always use optimized database views for accurate totals
        if (data && data.length > 0) {
          console.log('⚠️ Ignoring provided data (limited to 1000 records) - using optimized calculation instead')
          // Continue to optimized calculation below instead of returning early
        }
        
        // Try optimized hybrid approach
        const startDate = dateRange?.from ? formatDateLocal(dateRange.from) : undefined
        const endDate = dateRange?.to ? formatDateLocal(dateRange.to) : undefined

        console.log('🚀 Attempting optimized KPI calculation with branch filter:', branchFilter)
        const result = await fetchKPIsHybrid(startDate, endDate, branchFilter)
        
        setKpis(result)
        
        // Check if we got optimized data (hybrid function returns success indicator)
        const wasOptimized = result.isOptimized ?? (!!result.dateRange || !startDate)
        setIsOptimized(wasOptimized)
        
        console.log(`✅ KPIs loaded using ${wasOptimized ? 'optimized' : 'fallback'} method`)
        
      } catch (err) {
        console.error('Error loading KPIs:', err)
        setError('Failed to load KPIs - please check database connection')
        
        // Don't use mock data fallback as it gives wrong totals
        // Set zero values to indicate error state
        console.log('❌ KPI calculation failed - showing zero values')
        setKpis({
          totalRevenue: 0,
          totalProfit: 0,
          profitMargin: 0,
          taxableSales: 0,
          totalQuantity: 0,
          totalCost: 0,
          averageOrderValue: 0,
          totalInvoices: 0,
          grossProfit: 0,
          grossProfitPercentage: 0,
          totalStockValue: 0,
          dailyAvgSales: 0,
          totalPayables: 0,
          visits: 0,
        })
        setIsOptimized(false)
      } finally {
        setLoading(false)
      }
    }

    loadKPIs()
  }, [data, dateRange, branchFilter])

  return { kpis, loading, error, isOptimized }
}

// Chart data hook removed - charts are no longer used

export function usePaginatedTransactions(
  pageSize: number = 50,
  dateRange?: DateRange,
  branchFilter?: string
) {
  const [data, setData] = useState<ProfitAnalysisViewCurrent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    totalCount: 0,
    pageSize: pageSize,
    currentOffset: 0,
    hasMore: false,
    totalPages: 0
  })
  const [isOptimized, setIsOptimized] = useState(false)

  const loadPage = async (offset: number = 0) => {
    try {
      setLoading(true)
      setError(null)

      const startDate = formatDateLocal(dateRange.from)
      const endDate = formatDateLocal(dateRange.to)

      // Try optimized pagination first
      const result = await fetchPaginatedTransactions(
        pageSize,
        offset,
        startDate,
        endDate,
        branchFilter
      )

      if (result) {
        console.log('✅ Using optimized pagination')
        setData(result.data)
        setPagination(result.pagination)
        setIsOptimized(true)
      } else {
        console.log('🔄 Falling back to original pagination')
        // Fallback to original method with manual pagination
        let allData: ProfitAnalysisViewCurrent[]
        
        if (startDate && endDate) {
          allData = await fetchProfitAnalysisDataByDateRange(startDate, endDate)
        } else {
          allData = await fetchProfitAnalysisData()
        }

        // Filter by branch if needed
        if (branchFilter) {
          allData = allData.filter(item => item['Branch Name'] === branchFilter)
        }

        // Apply manual pagination
        const paginatedData = allData.slice(offset, offset + pageSize)
        setData(paginatedData)
        setPagination({
          totalCount: allData.length,
          pageSize,
          currentOffset: offset,
          hasMore: offset + pageSize < allData.length,
          totalPages: Math.ceil(allData.length / pageSize)
        })
        setIsOptimized(false)
      }
    } catch (err) {
      console.error('Error loading paginated transactions:', err)
      setError('Failed to load transactions')
      
      // Don't use mock data - show empty state
      setData([])
      setPagination({
        totalCount: 0,
        pageSize,
        currentOffset: offset,
        hasMore: false,
        totalPages: 0
      })
      setIsOptimized(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPage(0) // Load first page when dependencies change
  }, [pageSize, dateRange, branchFilter])

  const nextPage = () => {
    if (pagination.hasMore) {
      const nextOffset = pagination.currentOffset + pageSize
      loadPage(nextOffset)
    }
  }

  const prevPage = () => {
    if (pagination.currentOffset > 0) {
      const prevOffset = Math.max(0, pagination.currentOffset - pageSize)
      loadPage(prevOffset)
    }
  }

  const goToPage = (page: number) => {
    const offset = page * pageSize
    if (offset >= 0 && offset < pagination.totalCount) {
      loadPage(offset)
    }
  }

  return {
    data,
    loading,
    error,
    pagination,
    isOptimized,
    nextPage,
    prevPage,
    goToPage,
    refresh: () => loadPage(pagination.currentOffset)
  }
}

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState({
    optimizedViewsAvailable: false,
    rpcFunctionsAvailable: false,
    totalRecordsInDatabase: 0,
    recommendedAction: 'Checking...'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkPerformance() {
      try {
        const result = await getPerformanceMetrics()
        setMetrics(result)
      } catch (error) {
        console.error('Error checking performance metrics:', error)
        setMetrics({
          optimizedViewsAvailable: false,
          rpcFunctionsAvailable: false,
          totalRecordsInDatabase: 0,
          recommendedAction: 'Error checking performance - please verify database setup'
        })
      } finally {
        setLoading(false)
      }
    }

    checkPerformance()
  }, [])

  return { metrics, loading }
}