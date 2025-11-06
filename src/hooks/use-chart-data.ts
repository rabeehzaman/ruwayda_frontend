import { useState, useEffect } from 'react'
import {
  getDailyRevenueTrend,
  getTopSellingProducts,
  getTopCustomers,
  getMonthlyRevenueComparison,
  getBranchPerformance,
  getProfitMarginDistribution,
  getWeeklyPerformance,
  getStockByWarehouse,
  type DailyRevenueTrend,
  type TopProduct,
  type TopCustomer,
  type MonthlyComparison,
  type BranchPerformance,
  type ProfitMarginDistribution,
  type WeeklyPerformance,
  type StockByWarehouse
} from '@/lib/database-optimized'
import { formatDateLocal } from '@/lib/utils'
import type { DateRange } from '@/components/dashboard/date-filter'

/**
 * Hook for daily revenue trend chart data
 */
export function useDailyRevenueTrend(dateRange?: DateRange, branchFilter?: string) {
  const [data, setData] = useState<DailyRevenueTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      
      try {
        const startDate = dateRange?.from ? formatDateLocal(dateRange.from) : undefined
        const endDate = dateRange?.to ? formatDateLocal(dateRange.to) : undefined
        
        const result = await getDailyRevenueTrend(startDate, endDate, branchFilter)
        
        if (result) {
          setData(result)
        } else {
          setError('Failed to load daily revenue trend data')
        }
      } catch (err) {
        setError('Error loading daily revenue trend data')
        console.error('Daily revenue trend hook error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange, branchFilter])

  return { data, loading, error }
}

/**
 * Hook for top selling products chart data
 */
export function useTopSellingProducts(
  dateRange?: DateRange, 
  branchFilter?: string, 
  limit: number = 10
) {
  const [data, setData] = useState<TopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      
      try {
        const startDate = dateRange?.from ? formatDateLocal(dateRange.from) : undefined
        const endDate = dateRange?.to ? formatDateLocal(dateRange.to) : undefined
        
        const result = await getTopSellingProducts(startDate, endDate, branchFilter, limit)
        
        if (result) {
          setData(result)
        } else {
          setError('Failed to load top selling products data')
        }
      } catch (err) {
        setError('Error loading top selling products data')
        console.error('Top selling products hook error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange, branchFilter, limit])

  return { data, loading, error }
}

/**
 * Hook for top customers chart data
 */
export function useTopCustomers(
  dateRange?: DateRange, 
  branchFilter?: string, 
  limit: number = 10
) {
  const [data, setData] = useState<TopCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      
      try {
        const startDate = dateRange?.from ? formatDateLocal(dateRange.from) : undefined
        const endDate = dateRange?.to ? formatDateLocal(dateRange.to) : undefined
        
        const result = await getTopCustomers(startDate, endDate, branchFilter, limit)
        
        if (result) {
          setData(result)
        } else {
          setError('Failed to load top customers data')
        }
      } catch (err) {
        setError('Error loading top customers data')
        console.error('Top customers hook error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange, branchFilter, limit])

  return { data, loading, error }
}

/**
 * Hook for monthly revenue comparison chart data
 */
export function useMonthlyRevenueComparison(dateRange?: DateRange, branchFilter?: string) {
  const [data, setData] = useState<MonthlyComparison[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      
      try {
        const startDate = dateRange?.from ? formatDateLocal(dateRange.from) : undefined
        const endDate = dateRange?.to ? formatDateLocal(dateRange.to) : undefined
        
        const result = await getMonthlyRevenueComparison(startDate, endDate, branchFilter)
        
        if (result) {
          setData(result)
        } else {
          setError('Failed to load monthly revenue comparison data')
        }
      } catch (err) {
        setError('Error loading monthly revenue comparison data')
        console.error('Monthly revenue comparison hook error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange, branchFilter])

  return { data, loading, error }
}

/**
 * Hook for branch performance chart data
 */
export function useBranchPerformance(dateRange?: DateRange) {
  const [data, setData] = useState<BranchPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      
      try {
        const startDate = dateRange?.from ? formatDateLocal(dateRange.from) : undefined
        const endDate = dateRange?.to ? formatDateLocal(dateRange.to) : undefined
        
        const result = await getBranchPerformance(startDate, endDate)
        
        if (result) {
          setData(result)
        } else {
          setError('Failed to load branch performance data')
        }
      } catch (err) {
        setError('Error loading branch performance data')
        console.error('Branch performance hook error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  return { data, loading, error }
}

/**
 * Hook for profit margin distribution chart data
 */
export function useProfitMarginDistribution(
  dateRange?: DateRange, 
  branchFilter?: string, 
  analysisType: 'products' | 'customers' = 'products'
) {
  const [data, setData] = useState<ProfitMarginDistribution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      
      try {
        const startDate = dateRange?.from ? formatDateLocal(dateRange.from) : undefined
        const endDate = dateRange?.to ? formatDateLocal(dateRange.to) : undefined
        
        const result = await getProfitMarginDistribution(startDate, endDate, branchFilter, analysisType)
        
        if (result) {
          setData(result)
        } else {
          setError('Failed to load profit margin distribution data')
        }
      } catch (err) {
        setError('Error loading profit margin distribution data')
        console.error('Profit margin distribution hook error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange, branchFilter, analysisType])

  return { data, loading, error }
}

/**
 * Hook for weekly performance chart data
 */
export function useWeeklyPerformance(dateRange?: DateRange, branchFilter?: string) {
  const [data, setData] = useState<WeeklyPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      
      try {
        const startDate = dateRange?.from ? formatDateLocal(dateRange.from) : undefined
        const endDate = dateRange?.to ? formatDateLocal(dateRange.to) : undefined
        
        const result = await getWeeklyPerformance(startDate, endDate, branchFilter)
        
        if (result) {
          setData(result)
        } else {
          setError('Failed to load weekly performance data')
        }
      } catch (err) {
        setError('Error loading weekly performance data')
        console.error('Weekly performance hook error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange, branchFilter])

  return { data, loading, error }
}

/**
 * Hook for stock by warehouse chart data
 */
export function useStockByWarehouse() {
  const [data, setData] = useState<StockByWarehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      
      try {
        const result = await getStockByWarehouse()
        
        if (result) {
          setData(result)
        } else {
          setError('Failed to load stock by warehouse data')
        }
      } catch (err) {
        setError('Error loading stock by warehouse data')
        console.error('Stock by warehouse hook error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}