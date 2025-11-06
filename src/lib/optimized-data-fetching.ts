import { supabase } from './supabase'
import type { ProfitAnalysisViewCurrent, DashboardKPIs } from '@/types/database'

// Optimized data fetching using new Supabase views and RPC functions
// Falls back to original methods if new database objects don't exist

export interface OptimizedKPIs extends DashboardKPIs {
  dateRange?: {
    from: string | null
    to: string | null
    actualFrom: string | null
    actualTo: string | null
  }
  isOptimized?: boolean
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    totalCount: number
    pageSize: number
    currentOffset: number
    hasMore: boolean
    totalPages: number
  }
}

/**
 * Fetch KPIs using optimized aggregated view (instant loading)
 * Falls back to original calculation if view doesn't exist
 */
export async function fetchOptimizedKPIs(): Promise<OptimizedKPIs | null> {
  try {
    console.log('🚀 Attempting to fetch KPIs from optimized view...')
    
    const { data, error } = await supabase
      .from('profit_totals_view')
      .select('*')
      .single()

    if (error) {
      console.log('📋 Optimized view not available, falling back to original method')
      return null
    }

    console.log('✅ Successfully fetched KPIs from optimized view')
    
    return {
      totalRevenue: data.total_revenue || 0,
      totalProfit: data.total_profit || 0,
      profitMargin: data.overall_profit_margin || 0,
      taxableSales: data.total_taxable_sales || 0,
      totalQuantity: 0, // Will be calculated in RPC version
      totalCost: data.total_cost || 0,
      averageOrderValue: data.unique_invoices > 0 ? (data.total_revenue || 0) / data.unique_invoices : 0,
      totalInvoices: data.unique_invoices || 0,
      grossProfit: (data.total_taxable_sales || 0) - (data.total_cost || 0),
      grossProfitPercentage: data.total_taxable_sales > 0 ? ((data.total_taxable_sales - data.total_cost) / data.total_taxable_sales) * 100 : 0,
      totalStockValue: 0, // TODO: Need to add stock data to optimized view
      dailyAvgSales: 0, // TODO: Need to calculate based on date range
      totalPayables: 0, // TODO: Need actual payables data
      visits: data.unique_invoices || 0, // Same as total invoices
      isOptimized: true
    }
  } catch (error) {
    console.error('Error fetching optimized KPIs:', error)
    return null
  }
}

/**
 * Fetch KPIs with date filtering using RPC function
 * Falls back to original method if RPC doesn't exist
 */
export async function fetchOptimizedKPIsWithDateFilter(
  startDate: string,
  endDate: string
): Promise<OptimizedKPIs | null> {
  try {
    console.log('🚀 Attempting to fetch filtered KPIs using RPC...')
    
    const { data, error } = await supabase
      .rpc('get_dashboard_kpis', {
        start_date: startDate,
        end_date: endDate
      })

    if (error) {
      console.log('📋 RPC function not available, falling back to original method')
      return null
    }

    console.log('✅ Successfully fetched filtered KPIs using RPC')
    
    return {
      totalRevenue: data.totalRevenue || 0,
      totalProfit: data.totalProfit || 0,
      profitMargin: data.profitMargin || 0,
      taxableSales: data.taxableSales || 0,
      totalQuantity: data.totalQuantity || 0,
      totalCost: data.totalCost || 0,
      averageOrderValue: data.averageOrderValue || 0,
      totalInvoices: data.uniqueInvoices || 0,
      grossProfit: (data.taxableSales || 0) - (data.totalCost || 0),
      grossProfitPercentage: data.taxableSales > 0 ? ((data.taxableSales - data.totalCost) / data.taxableSales) * 100 : 0,
      totalStockValue: 0, // TODO: Need to add stock data to RPC
      dailyAvgSales: 0, // TODO: Need to calculate based on date range
      totalPayables: 0, // TODO: Need actual payables data
      visits: data.uniqueInvoices || 0, // Same as total invoices
      dateRange: data.dateRange,
      isOptimized: true
    }
  } catch (error) {
    console.error('Error fetching filtered KPIs:', error)
    return null
  }
}

/**
 * Fetch branch summary using optimized view
 * Falls back to original method if view doesn't exist
 */
interface BranchSummary {
  branch_name: string
  branch_taxable_sales: number
  branch_revenue: number
  branch_cost: number
  branch_profit: number
  branch_invoices: number
  unique_branch_invoices: number
  avg_branch_sale_price: number
  branch_profit_margin: number
  first_transaction_date: string
  last_transaction_date: string
}

export async function fetchOptimizedBranchSummary(): Promise<BranchSummary[] | null> {
  try {
    console.log('🚀 Attempting to fetch branch summary from optimized view...')
    
    const { data, error } = await supabase
      .from('profit_by_branch_view')
      .select('*')
      .limit(10)

    if (error) {
      console.log('📋 Branch view not available, falling back to original method')
      return null
    }

    console.log('✅ Successfully fetched branch summary from optimized view')
    return data
  } catch (error) {
    console.error('Error fetching optimized branch summary:', error)
    return null
  }
}

/**
 * Fetch branch summary with date filtering using RPC
 */
interface BranchSummaryRPC {
  branchName: string
  taxableSales: number
  revenue: number
  cost: number
  profit: number
  invoices: number
  uniqueInvoices: number
  profitMargin: number
  averageOrderValue: number
}

export async function fetchOptimizedBranchSummaryWithDateFilter(
  startDate: string,
  endDate: string
): Promise<BranchSummaryRPC[] | null> {
  try {
    console.log('🚀 Attempting to fetch filtered branch summary using RPC...')
    
    const { data, error } = await supabase
      .rpc('get_branch_summary', {
        start_date: startDate,
        end_date: endDate
      })

    if (error) {
      console.log('📋 Branch RPC not available, falling back to original method')
      return null
    }

    console.log('✅ Successfully fetched filtered branch summary using RPC')
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching filtered branch summary:', error)
    return null
  }
}

/**
 * Fetch paginated transaction data using RPC
 * Falls back to original method if RPC doesn't exist
 */
export async function fetchPaginatedTransactions(
  pageSize: number = 50,
  pageOffset: number = 0,
  startDate?: string,
  endDate?: string,
  branchFilter?: string
): Promise<PaginatedResult<ProfitAnalysisViewCurrent> | null> {
  try {
    console.log('🚀 Attempting to fetch paginated transactions using RPC...')
    
    const { data, error } = await supabase
      .rpc('get_paginated_transactions', {
        page_size: pageSize,
        page_offset: pageOffset,
        start_date: startDate || null,
        end_date: endDate || null,
        branch_filter: branchFilter || null
      })

    if (error) {
      console.log('📋 Pagination RPC not available, falling back to original method')
      return null
    }

    console.log('✅ Successfully fetched paginated transactions using RPC')
    
    // Transform the data to match our expected format
    interface RawTransactionData {
      invNo: string
      invDate: string
      item: string
      qty: number
      salePrice: number
      saleWithVAT: number
      cost: number
      profit: number
      profitPercent: number
      customerName: string
      branchName: string
      salesPersonName: string
      invoiceStatus: string
    }

    const transformedData = data.data?.map((item: RawTransactionData): ProfitAnalysisViewCurrent => ({
      'Inv No': item.invNo,
      'Inv Date': item.invDate,
      'Item': item.item,
      'Qty': item.qty,
      'Sale Price': item.salePrice,
      'SaleWithVAT': item.saleWithVAT,
      'Cost': item.cost,
      'Profit': item.profit,
      'Profit %': item.profitPercent,
      'Customer Name': item.customerName,
      'Branch Name': item.branchName,
      'Unit Price': item.salePrice, // Assuming same as sale price for single qty
      'Unit Cost': item.cost, // Assuming same as cost for single qty  
      'Unit Profit': item.profit, // Assuming same as profit for single qty
      'Sales Person Name': item.salesPersonName,
      'Invoice Status': item.invoiceStatus
    })) || []

    return {
      data: transformedData,
      pagination: data.pagination || {
        totalCount: 0,
        pageSize,
        currentOffset: pageOffset,
        hasMore: false,
        totalPages: 0
      }
    }
  } catch (error) {
    console.error('Error fetching paginated transactions:', error)
    return null
  }
}

/**
 * Hybrid fetch function that tries optimized methods first, then falls back
 * CRITICAL: Always uses consistent data source to ensure KPIs and table totals match
 */
export async function fetchKPIsHybrid(
  startDate?: string,
  endDate?: string,
  branchFilter?: string
): Promise<OptimizedKPIs> {
  console.log(`📊 fetchKPIsHybrid called with: startDate=${startDate}, endDate=${endDate}, branchFilter=${branchFilter}`)
  
  // CRITICAL FIX: Always use the same data source as tables for consistency
  // This ensures KPIs and table totals always match exactly
  console.log('🔄 Using consistent data source method for KPIs to match table calculations')
  const { calculateDashboardKPIs, fetchProfitAnalysisData, fetchProfitAnalysisDataByDateRange } = await import('./data-fetching')
  
  let data
  if (startDate && endDate) {
    data = await fetchProfitAnalysisDataByDateRange(startDate, endDate)
    console.log(`📅 Fetched ${data.length} records for date range: ${startDate} to ${endDate}`)
  } else {
    data = await fetchProfitAnalysisData()
    console.log(`📊 Fetched ${data.length} total records`)
  }
  
  // Apply branch filter if specified (same logic as tables)
  if (branchFilter) {
    const originalCount = data.length
    data = data.filter(item => item['Branch Name'] === branchFilter)
    console.log(`🏢 Branch filter '${branchFilter}': ${originalCount} → ${data.length} records`)
  }
  
  const kpis = await calculateDashboardKPIs(data, startDate && endDate ? { from: new Date(startDate), to: new Date(endDate) } : undefined)
  
  console.log('✅ KPIs calculated from same data source as tables:', {
    records: data.length,
    taxableSales: kpis.taxableSales,
    totalRevenue: kpis.totalRevenue,
    branchFilter: branchFilter || 'all'
  })
  
  return {
    ...kpis,
    isOptimized: false // Using consistent method with tables
  }
}

/**
 * Fetch optimized chart data using RPC function
 * Falls back to original method if RPC doesn't exist
 */
export async function fetchOptimizedChartData(
  startDate?: string,
  endDate?: string,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<{
  revenueChart: { date: string; value: number; label: string }[]
  profitChart: { date: string; value: number; label: string }[]
  marginChart: { date: string; value: number; label: string }[]
  isOptimized: boolean
} | null> {
  try {
    console.log('🚀 Attempting to fetch chart data using RPC...')
    
    const { data, error } = await supabase
      .rpc('get_chart_data', {
        start_date: startDate || null,
        end_date: endDate || null,
        group_by_period: groupBy
      })

    if (error) {
      console.log('📋 Chart RPC function not available, falling back to original method')
      return null
    }

    console.log('✅ Successfully fetched chart data using RPC')
    
    return {
      revenueChart: data.revenueChart || [],
      profitChart: data.profitChart || [],
      marginChart: data.marginChart || [],
      isOptimized: true
    }
  } catch (error) {
    console.error('Error fetching optimized chart data:', error)
    return null
  }
}

/**
 * Get performance metrics for the current setup
 */
export async function getPerformanceMetrics(): Promise<{
  optimizedViewsAvailable: boolean
  rpcFunctionsAvailable: boolean
  totalRecordsInDatabase: number
  recommendedAction: string
}> {
  let optimizedViewsAvailable = false
  let rpcFunctionsAvailable = false
  let totalRecordsInDatabase = 0

  // Test optimized views
  try {
    const { error: viewError } = await supabase
      .from('profit_totals_view')
      .select('total_invoices')
      .single()
    
    optimizedViewsAvailable = !viewError
  } catch (error) {
    // Views not available
  }

  // Test RPC functions
  try {
    const { error: rpcError } = await supabase
      .rpc('get_dashboard_kpis')
    
    rpcFunctionsAvailable = !rpcError
  } catch (error) {
    // RPC not available
  }

  // Get total record count
  try {
    const { count, error } = await supabase
      .from('profit_analysis_view_current')
      .select('*', { count: 'exact', head: true })
    
    totalRecordsInDatabase = count || 0
  } catch (error) {
    console.error('Error getting record count:', error)
  }

  let recommendedAction = ''
  if (!optimizedViewsAvailable && !rpcFunctionsAvailable) {
    recommendedAction = 'Execute the SQL setup in Supabase to enable optimized performance'
  } else if (!optimizedViewsAvailable) {
    recommendedAction = 'Some database views are missing - check SQL setup'
  } else if (!rpcFunctionsAvailable) {
    recommendedAction = 'Some RPC functions are missing - check SQL setup'
  } else {
    recommendedAction = 'All optimizations are active and working correctly'
  }

  return {
    optimizedViewsAvailable,
    rpcFunctionsAvailable,
    totalRecordsInDatabase,
    recommendedAction
  }
}