// =============================================================================
// OPTIMIZED DATABASE LAYER - Uses new views and RPC functions
// =============================================================================
// This replaces the old data fetching with the new optimized database views
// and RPC functions that ensure perfect data consistency between KPIs and tables
// =============================================================================

import { supabase } from './supabase'
import { formatDateLocal } from './utils'

// =============================================================================
// ACTIVE BRANCHES API
// =============================================================================
// NOTE: Single location organization - branch filtering disabled
// This function returns empty array as there's only one location

export async function getActiveBranches(startDate?: Date, endDate?: Date): Promise<string[]> {
  // Single location organization - no branch filtering needed
  return []
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert branch names to location IDs for optimized filtering
 * NOTE: Single location organization - this function is deprecated
 * Kept for compatibility but returns empty array
 */
async function convertBranchNamesToLocationIds(branchNames: string[]): Promise<string[]> {
  // Single location organization - no branch table or filtering needed
  return []
}

// =============================================================================
// TYPES
// =============================================================================

export interface OptimizedKPIs {
  total_revenue: number
  total_taxable_sales: number
  total_cost: number
  total_profit: number // This is actually gross_profit
  profit_margin_percent: number // This is net_profit_margin
  gross_profit_percentage: number // This is gross_profit_margin
  total_quantity: number
  total_line_items: number
  total_invoices: number
  unique_customers: number
  active_branches: number
  average_order_value: number
  earliest_transaction: string
  latest_transaction: string
  total_stock_value: number
  gross_profit: number
  net_profit: number
  total_expenses: number
  gross_profit_margin: number
  net_profit_margin: number
  daily_avg_sales: number
  net_vat_payable: number
}

export interface OptimizedTransaction {
  inv_no: string
  inv_date: string
  item: string
  qty: number
  sale_price: number
  sale_with_vat: number
  cost: number
  profit: number
  profit_percent: number
  customer_name: string
  branch_name: string
  unit_price: number
  unit_cost: number
  unit_profit: number
  sales_person_name: string
  invoice_status: string
  total_count?: number
}

export interface OptimizedCustomer {
  customer_name: string
  total_invoices: number
  total_quantity: number
  total_sale_price: number
  total_sale_with_vat: number
  total_cost: number
  total_profit: number
  profit_margin_percent: number
  first_transaction_date: string
  last_transaction_date: string
  total_line_items: number
}

export interface OptimizedInvoice {
  invoice_no: string
  inv_date: string
  customer_name: string
  branch_name: string
  line_items_count: number
  total_quantity: number
  total_sale_price: number
  total_sale_with_vat: number
  sale_without_vat: number  // Added: Sales WITHOUT VAT (for display options)
  total_cost: number
  total_profit: number
  profit_margin_percent: number
  total_count?: number
}

export interface OptimizedStock {
  product_name: string
  warehouse: string
  unit: string
  stock_quantity: number
  stock_in_pieces: number
  current_stock_value: number
  stock_value_with_vat: number
  unit_cost: number
  vat_amount: number
}

export interface PaginationInfo {
  totalCount: number
  pageSize: number
  currentOffset: number
  hasMore: boolean
  totalPages: number
}

// =============================================================================
// KPI FUNCTIONS
// =============================================================================

/**
 * Get dashboard KPIs using the optimized RPC function for 2025 data only
 * This ensures KPIs match table totals exactly and improves performance
 */
export async function getOptimizedKPIs(
  startDate?: string,
  endDate?: string,
  branchFilters?: string[]
): Promise<OptimizedKPIs | null> {
  try {
    console.log('🎯 Fetching KPIs with optimized RPC:', { startDate, endDate, branchFilters })

    // Convert branch names to location IDs for indexed filtering
    const locationIds = branchFilters && branchFilters.length > 0
      ? await convertBranchNamesToLocationIds(branchFilters)
      : null

    // Try optimized 2025 function first, fallback to original if it doesn't exist
    let { data, error } = await supabase.rpc('get_dashboard_kpis_2025_optimized', {
      start_date: startDate || '2025-01-01',
      end_date: endDate || formatDateLocal(new Date()),
      location_ids: locationIds
    })

    // If 2025 function doesn't exist or returns no data, try the original function
    // Note: RPC functions return JSONB, not arrays, so don't check .length
    if (error || !data) {
      console.log('⚠️ 2025 function failed, trying original function:', error?.message)
      const fallback = await supabase.rpc('get_dashboard_kpis', {
        start_date: startDate || null,
        end_date: endDate || null,
        branch_filter: branchFilters && branchFilters.length === 1 ? branchFilters[0] : null
      })
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      console.error('❌ Error fetching optimized KPIs:', error)
      return null
    }

    if (!data) {
      console.warn('⚠️ No KPI data returned')
      return null
    }

    // The function returns JSON with camelCase keys: {totalRevenue, totalTaxableSales, grossProfit, netProfit, ...}
    // We need to convert to snake_case to match OptimizedKPIs interface
    const rawKpis = Array.isArray(data) ? data[0] : data
    console.log('🔍 DEBUG rawKpis:', JSON.stringify(rawKpis, null, 2))
    const kpis = {
      total_revenue: rawKpis.totalRevenue || 0, // Total sales WITH VAT
      total_taxable_sales: rawKpis.totalTaxableSales || 0, // Total sales WITHOUT VAT
      total_cost: rawKpis.totalCost || 0,
      total_profit: rawKpis.grossProfit || 0, // This is actually gross profit (for backwards compatibility)
      profit_margin_percent: rawKpis.netProfitMargin || 0, // Net profit margin
      gross_profit_percentage: rawKpis.grossProfitMargin || 0, // Gross profit margin (GP%)
      total_quantity: rawKpis.totalQuantity || 0,
      total_line_items: rawKpis.totalInvoices || 0,
      total_invoices: rawKpis.uniqueInvoices || 0,
      unique_customers: 0, // Not returned by function
      active_branches: 0, // Not returned by function
      average_order_value: rawKpis.averageOrderValue || 0,
      earliest_transaction: '', // Not returned by function
      latest_transaction: '', // Not returned by function
      total_stock_value: rawKpis.totalStockValue || 0,
      gross_profit: rawKpis.grossProfit || 0,
      net_profit: rawKpis.netProfit || 0,
      total_expenses: rawKpis.totalExpenses || 0,
      gross_profit_margin: rawKpis.grossProfitMargin || 0,
      net_profit_margin: rawKpis.netProfitMargin || 0,
      daily_avg_sales: rawKpis.dailyAvgSales || 0,
      net_vat_payable: rawKpis.netVatPayable || 0
    }

    console.log('✅ Optimized KPIs loaded:', {
      totalRevenue: kpis.total_revenue,
      taxableSales: kpis.total_taxable_sales,
      totalProfit: kpis.total_profit,
      totalInvoices: kpis.total_invoices,
      recordsUsed: 'All (no 1000 record limit)'
    })

    return kpis
  } catch (error) {
    console.error('❌ Exception fetching optimized KPIs:', error)
    return null
  }
}

// =============================================================================
// TOTALS FUNCTIONS (for accurate totals regardless of pagination)
// =============================================================================

export interface ProfitByItemTotals {
  total_records: number
  total_qty: number
  total_sale_price: number
  total_sale_with_vat: number
  total_cost: number
  total_profit: number
}

export interface ProfitByInvoiceTotals {
  total_invoices: number
  total_line_items: number
  total_quantity: number
  total_sale_price: number
  total_sale_with_vat: number
  total_cost: number
  total_profit: number
}

/**
 * Get accurate totals for profit by item (regardless of pagination/search)
 */
export async function getProfitByItemTotals(
  startDate?: string,
  endDate?: string,
  branchFilter?: string,
  searchQuery?: string
): Promise<ProfitByItemTotals | null> {
  try {
    console.log('📊 Fetching profit by item totals:', { startDate, endDate, branchFilter, searchQuery })

    const { data, error } = await supabase.rpc('get_profit_by_item_totals', {
      start_date: startDate || null,
      end_date: endDate || null,
      branch_filter: branchFilter || null,
      search_query: searchQuery || null
    })

    if (error) {
      console.error('❌ Error fetching profit by item totals:', error)
      return null
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No profit by item totals returned')
      return null
    }

    console.log('✅ Profit by item totals loaded:', data[0])
    return data[0]
  } catch (error) {
    console.error('❌ Exception fetching profit by item totals:', error)
    return null
  }
}

/**
 * Get accurate totals for profit by invoice (regardless of pagination/search)
 */
export async function getProfitByInvoiceTotals(
  startDate?: string,
  endDate?: string,
  branchFilter?: string,
  searchQuery?: string
): Promise<ProfitByInvoiceTotals | null> {
  try {
    console.log('📋 Fetching profit by invoice totals:', { startDate, endDate, branchFilter, searchQuery })

    const { data, error } = await supabase.rpc('get_profit_by_invoice_totals', {
      start_date: startDate || null,
      end_date: endDate || null,
      branch_filter: branchFilter || null,
      search_query: searchQuery || null
    })

    if (error) {
      console.error('❌ Error fetching profit by invoice totals:', error)
      return null
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No profit by invoice totals returned')
      return null
    }

    console.log('✅ Profit by invoice totals loaded:', data[0])
    return data[0]
  } catch (error) {
    console.error('❌ Exception fetching profit by invoice totals:', error)
    return null
  }
}

// =============================================================================
// TABLE DATA FUNCTIONS
// =============================================================================

/**
 * Get profit by item data with filtering and pagination (2025 data only)
 */
export async function getOptimizedProfitByItem(
  startDate?: string,
  endDate?: string,
  branchFilters?: string[],
  itemFilter?: string,
  customerFilter?: string,
  invoiceFilter?: string,
  pageLimit: number = 10000,
  pageOffset: number = 0
): Promise<{ data: OptimizedTransaction[], pagination: PaginationInfo } | null> {
  try {
    console.log('📊 Fetching profit by item (optimized):', { startDate, endDate, branchFilters, itemFilter, customerFilter, invoiceFilter, pageLimit, pageOffset })

    // Convert branch names to location IDs for indexed filtering
    const locationIds = branchFilters && branchFilters.length > 0
      ? await convertBranchNamesToLocationIds(branchFilters)
      : null

    // Try optimized function first, fallback to original if it doesn't exist
    let { data, error } = await supabase.rpc('get_profit_by_item_2025_filtered_optimized', {
      start_date: startDate || '2025-01-01',
      end_date: endDate || formatDateLocal(new Date()),
      location_ids: locationIds,
      item_filter: itemFilter || null,
      customer_filter: customerFilter || null,
      invoice_filter: invoiceFilter || null,
      page_limit: pageLimit,
      page_offset: pageOffset
    })

    // If optimized function doesn't exist or returns no data, try the original function
    if (error || !data || data.length === 0) {
      console.log('⚠️ get_profit_by_item_2025_filtered_optimized failed, trying fallback:', error?.message)
      // Build a search query from the filters for the original function
      let searchQuery = null
      if (itemFilter) searchQuery = itemFilter
      else if (customerFilter) searchQuery = customerFilter
      else if (invoiceFilter) searchQuery = invoiceFilter

      const fallback = await supabase.rpc('get_profit_by_item_filtered', {
        start_date: startDate || null,
        end_date: endDate || null,
        branch_filter: branchFilters && branchFilters.length === 1 ? branchFilters[0] : null,
        search_query: searchQuery,
        page_limit: pageLimit,
        page_offset: pageOffset
      })
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      console.error('❌ Error fetching profit by item:', error)
      return null
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No profit by item data returned from RPC')
      return {
        data: [],
        pagination: {
          totalCount: 0,
          pageSize: pageLimit,
          currentOffset: pageOffset,
          hasMore: false,
          totalPages: 0
        }
      }
    }

    const totalCount = data[0]?.total_count || 0
    const totalPages = Math.ceil(totalCount / pageLimit)
    const hasMore = pageOffset + pageLimit < totalCount

    console.log('✅ Profit by item loaded:', { records: data.length, totalCount })

    return {
      data,
      pagination: {
        totalCount,
        pageSize: pageLimit,
        currentOffset: pageOffset,
        hasMore,
        totalPages
      }
    }
  } catch (error) {
    console.error('❌ Exception fetching profit by item:', error)
    return null
  }
}

/**
 * Get profit by customer data with filtering (2025 data only)
 */
export async function getOptimizedProfitByCustomer(
  startDate?: string,
  endDate?: string,
  branchFilters?: string[],
  customerFilter?: string
): Promise<OptimizedCustomer[] | null> {
  try {
    console.log('👥 Fetching profit by customer (optimized):', { startDate, endDate, branchFilters, customerFilter })

    // Convert branch names to location IDs for indexed filtering
    const locationIds = branchFilters && branchFilters.length > 0
      ? await convertBranchNamesToLocationIds(branchFilters)
      : null

    // Try optimized function first, fallback to original if it doesn't exist
    let { data, error } = await supabase.rpc('get_profit_by_customer_2025_optimized', {
      start_date: startDate || '2025-01-01',
      end_date: endDate || formatDateLocal(new Date()),
      location_ids: locationIds,
      customer_filter: customerFilter || null
    })

    // If optimized function doesn't exist or returns no data, try the original function
    if (error || !data || data.length === 0) {
      console.log('⚠️ get_profit_by_customer_2025_optimized failed, trying fallback:', error?.message)
      const fallback = await supabase.rpc('get_profit_by_customer_filtered', {
        start_date: startDate || null,
        end_date: endDate || null,
        branch_filter: branchFilters && branchFilters.length === 1 ? branchFilters[0] : null,
        search_query: customerFilter || null
      })
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      console.error('❌ Error fetching profit by customer:', error)
      return null
    }

    console.log('✅ Profit by customer loaded:', { customers: data?.length || 0 })
    return data || []
  } catch (error) {
    console.error('❌ Exception fetching profit by customer:', error)
    return null
  }
}

/**
 * Get profit by invoice data with filtering and pagination (2025 data only)
 */
export async function getOptimizedProfitByInvoice(
  startDate?: string,
  endDate?: string,
  branchFilters?: string[],
  customerFilter?: string,
  invoiceFilter?: string,
  pageLimit: number = 10000,
  pageOffset: number = 0
): Promise<{ data: OptimizedInvoice[], pagination: PaginationInfo } | null> {
  try {
    console.log('📋 Fetching profit by invoice (2025 only):', { startDate, endDate, branchFilters, customerFilter, invoiceFilter, pageLimit, pageOffset })

    // Use the RPC function for all cases (multi-branch or single branch)
    let { data, error } = await supabase.rpc('get_profit_by_invoice_2025_filtered', {
      start_date: startDate || '2025-01-01',
      end_date: endDate || formatDateLocal(new Date()),
      branch_filters: (branchFilters && branchFilters.length > 0) ? branchFilters : null,
      customer_filter: customerFilter || null
    })

    // If 2025 function doesn't exist or returns no data, try the original function
    // Note: Check for empty array properly
    // IMPORTANT: Only fallback for single branch or no branch filters
    // Multi-branch filtering not supported by legacy function
    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      // Only attempt fallback if we have 0 or 1 branches selected
      // Legacy function only supports single branch filtering
      if (!branchFilters || branchFilters.length <= 1) {
        console.log('⚠️ get_profit_by_invoice_2025_filtered failed, trying original function:', error?.message)

        const fallback = await supabase.rpc('get_profit_by_invoice_filtered', {
          start_date: startDate || null,
          end_date: endDate || null,
          branch_filter: branchFilters && branchFilters.length === 1 ? branchFilters[0] : null,
          customer_filter: customerFilter || null
        })
        data = fallback.data
        error = fallback.error
      } else {
        // Multi-branch filter requested but primary function failed
        // Don't fallback as it would lose the multi-branch filter
        console.error('❌ Multi-branch filtering failed and fallback not compatible:', error?.message)
        console.error('Selected branches:', branchFilters)
        // Return empty results rather than incorrect filtered results
        return {
          data: [],
          pagination: {
            totalCount: 0,
            pageSize: pageLimit,
            currentOffset: pageOffset,
            hasMore: false,
            totalPages: 0
          }
        }
      }
    }

    if (error) {
      console.error('❌ Error fetching profit by invoice:', error)
      return null
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No profit by invoice data returned from RPC')
      return {
        data: [],
        pagination: {
          totalCount: 0,
          pageSize: pageLimit,
          currentOffset: pageOffset,
          hasMore: false,
          totalPages: 0
        }
      }
    }

    // Since RPC returns all data, implement client-side pagination
    const totalCount = data.length
    const totalPages = Math.ceil(totalCount / pageLimit)
    const hasMore = pageOffset + pageLimit < totalCount
    const paginatedData = data.slice(pageOffset, pageOffset + pageLimit)

    console.log('✅ Profit by invoice loaded:', { records: paginatedData.length, totalCount })

    // Map the RPC response fields to match our interface
    const mappedData = paginatedData.map((item: Record<string, unknown>) => {
      const saleWithVat = item.sale_value as number || 0  // NOW: This is WITH VAT
      const saleWithoutVat = item.sale_without_vat as number || 0  // NEW: Sales WITHOUT VAT
      const profit = item.profit as number || 0
      const cost = saleWithoutVat - profit // Cost = sales without VAT - profit

      return {
        invoice_no: item.invoice_number || item.inv_no || item.invoice_no,
        inv_date: item.invoice_date || item.inv_date,
        customer_name: item.customer_name,
        branch_name: item.branch_name,
        line_items_count: 1, // RPC doesn't return this, default to 1
        total_quantity: 1, // RPC doesn't return this
        total_sale_price: saleWithoutVat, // Sales WITHOUT VAT (correct now)
        total_sale_with_vat: saleWithVat, // Sale value WITH VAT (matches KPI)
        sale_without_vat: saleWithoutVat, // NEW: Added for interface compatibility
        total_cost: cost, // Cost = sales without VAT - profit
        total_profit: profit,
        profit_margin_percent: item.margin || item.profit_margin_percent || 0,
        total_count: totalCount
      }
    })

    return {
      data: mappedData,
      pagination: {
        totalCount,
        pageSize: pageLimit,
        currentOffset: pageOffset,
        hasMore,
        totalPages
      }
    }
  } catch (error) {
    console.error('❌ Exception fetching profit by invoice:', error)
    return null
  }
}

/**
 * Get stock report data with warehouse filtering
 */
export async function getOptimizedStockReport(warehouseFilter?: string): Promise<OptimizedStock[] | null> {
  try {
    console.log('📦 Fetching stock report with warehouse filter:', { warehouseFilter })

    // Try filtered function first
    let { data, error } = await supabase.rpc('get_stock_report_filtered', {
      branch_filter: warehouseFilter || null,
      item_filter: null
    })

    // If filtered function doesn't exist, try the original view
    if (error) {
      console.log('⚠️ get_stock_report_filtered failed, trying stock_report_view:', error?.message)
      let query = supabase.from('stock_report_view').select('*').order('product_name', { ascending: true })

      if (warehouseFilter) {
        query = query.eq('warehouse', warehouseFilter)
      }

      const fallback = await query
      data = fallback.data
      error = fallback.error

      // If view also doesn't exist, return stub data message
      if (error) {
        console.warn('⚠️ Stock report not available in SWEETS database')
        return [] // Return empty array so UI can show "No stock data available"
      }
    }

    // Map the response to match our interface
    const mappedData = data?.map((item: Record<string, unknown>) => ({
      product_name: item.product_name,
      warehouse: item.warehouse || 'N/A',
      unit: item.unit || 'Unit',
      stock_quantity: item.stock_quantity || 0,
      stock_in_pieces: item.stock_in_pieces || 0,
      current_stock_value: item.current_stock_value || 0,
      stock_value_with_vat: item.stock_value_with_vat || 0,
      unit_cost: item.unit_cost || 0,
      vat_amount: item.vat_amount || 0
    })) || []

    console.log('✅ Stock report loaded:', { items: mappedData.length })
    return mappedData
  } catch (error) {
    console.error('❌ Exception fetching stock report:', error)
    return []  // Return empty array instead of null
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert date range to string format for RPC functions
 * Uses local timezone to avoid date shifting issues
 */
export function formatDateForRPC(date: Date): string {
  return formatDateLocal(date)
}

/**
 * Test all optimized functions to verify they're working
 */
export async function testOptimizedFunctions(): Promise<{
  kpis: boolean
  profitByItem: boolean
  profitByCustomer: boolean
  profitByInvoice: boolean
  stockReport: boolean
}> {
  console.log('🧪 Testing all optimized database functions...')

  const results = {
    kpis: false,
    profitByItem: false,
    profitByCustomer: false,
    profitByInvoice: false,
    stockReport: false
  }

  try {
    // Test KPIs
    const kpis = await getOptimizedKPIs()
    results.kpis = kpis !== null
    console.log('KPIs test:', results.kpis ? '✅' : '❌')

    // Test profit by item
    const items = await getOptimizedProfitByItem(undefined, undefined, undefined, undefined, undefined, undefined, 5, 0)
    results.profitByItem = items !== null
    console.log('Profit by item test:', results.profitByItem ? '✅' : '❌')

    // Test profit by customer
    const customers = await getOptimizedProfitByCustomer(undefined, undefined, undefined, undefined)
    results.profitByCustomer = customers !== null
    console.log('Profit by customer test:', results.profitByCustomer ? '✅' : '❌')

    // Test profit by invoice
    const invoices = await getOptimizedProfitByInvoice(undefined, undefined, undefined, undefined, undefined, 5, 0)
    results.profitByInvoice = invoices !== null
    console.log('Profit by invoice test:', results.profitByInvoice ? '✅' : '❌')

    // Test stock report
    const stock = await getOptimizedStockReport(undefined)
    results.stockReport = stock !== null
    console.log('Stock report test:', results.stockReport ? '✅' : '❌')

  } catch (error) {
    console.error('❌ Error testing optimized functions:', error)
  }

  const allPassed = Object.values(results).every(result => result)
  console.log('🎯 All tests passed:', allPassed ? '✅' : '❌')

  return results
}

// =============================================================================
// CHART DATA FUNCTIONS
// =============================================================================

export interface DailyRevenueTrend {
  date_key: string
  daily_revenue: number
  daily_profit: number
  daily_invoices: number
  profit_margin_percent: number
}

export interface TopProduct {
  product_name: string
  total_revenue: number
  total_quantity: number
  total_profit: number
  profit_margin_percent: number
  invoice_count: number
}

export interface TopCustomer {
  customer_name: string
  total_revenue: number
  total_profit: number
  profit_margin_percent: number
  invoice_count: number
  avg_order_value: number
}

export interface MonthlyComparison {
  month_key: string
  year_val: number
  month_val: number
  monthly_revenue: number
  monthly_profit: number
  monthly_invoices: number
  profit_margin_percent: number
  avg_daily_revenue: number
}

export interface BranchPerformance {
  branch_name: string
  total_revenue: number
  total_profit: number
  profit_margin_percent: number
  invoice_count: number
  avg_order_value: number
  unique_customers: number
}

export interface ProfitMarginDistribution {
  margin_range: string
  item_count: number
  total_revenue: number
  percentage_of_total: number
}

export interface WeeklyPerformance {
  day_of_week: number
  day_name: string
  total_revenue: number
  total_invoices: number
  avg_order_value: number
}

export interface StockByWarehouse {
  warehouse_name: string
  total_stock_value: number
  total_stock_value_with_vat: number
  product_count: number
  total_quantity: number
  avg_unit_cost: number
}

/**
 * Get daily revenue trend data for line chart
 */
export async function getDailyRevenueTrend(
  startDate?: string,
  endDate?: string,
  branchFilter?: string
): Promise<DailyRevenueTrend[] | null> {
  try {
    console.log('📈 Fetching daily revenue trend:', { startDate, endDate, branchFilter })

    // Try the new chart function first
    let { data, error } = await supabase.rpc('get_daily_revenue_trend', {
      start_date: startDate || '2025-01-01',
      end_date: endDate || formatDateLocal(new Date()),
      branch_filter: branchFilter || null
    })

    // If the function doesn't exist, create fallback data from existing profit data
    if (error && error.message?.includes('function') && error.message?.includes('does not exist')) {
      console.log('⚠️ Chart function does not exist, creating fallback data from profit_analysis_view_current')
      
      // Get data from existing view and aggregate by date
      const fallbackQuery = supabase
        .from('profit_analysis_view_current')
        .select('*')
        .gte('Inv Date', startDate || '2025-01-01')
        .lte('Inv Date', endDate || formatDateLocal(new Date()))
      
      if (branchFilter) {
        fallbackQuery.eq('Branch Name', branchFilter)
      }
      
      const { data: rawData, error: fallbackError } = await fallbackQuery
      
      if (fallbackError) {
        console.error('❌ Fallback query failed:', fallbackError)
        return []
      }
      
      if (!rawData || rawData.length === 0) {
        console.log('⚠️ No fallback data available')
        return []
      }
      
      // Aggregate data by date
      const dateMap = new Map<string, {
        daily_revenue: number
        daily_profit: number
        daily_invoices: Set<string>
      }>()
      
      rawData.forEach(row => {
        const date = row['Inv Date']?.split('T')[0] || row['Inv Date']
        if (!date) return
        
        const revenue = Number(row['Sale Price']) || 0
        const cost = Number(row['Cost']) || 0
        const profit = revenue - cost
        const invoiceNo = row['Inv No']
        
        if (!dateMap.has(date)) {
          dateMap.set(date, {
            daily_revenue: 0,
            daily_profit: 0,
            daily_invoices: new Set()
          })
        }
        
        const dayData = dateMap.get(date)!
        dayData.daily_revenue += revenue
        dayData.daily_profit += profit
        if (invoiceNo) dayData.daily_invoices.add(invoiceNo)
      })
      
      // Convert to chart data format
      data = Array.from(dateMap.entries()).map(([date, values]) => ({
        date_key: date,
        daily_revenue: values.daily_revenue,
        daily_profit: values.daily_profit,
        daily_invoices: values.daily_invoices.size,
        profit_margin_percent: values.daily_revenue > 0 ? 
          ((values.daily_profit / values.daily_revenue) * 100) : 0
      })).sort((a, b) => a.date_key.localeCompare(b.date_key))
      
      error = null
    }

    if (error) {
      console.error('❌ Error fetching daily revenue trend:', error)
      return []
    }

    console.log('✅ Daily revenue trend loaded:', { records: data?.length || 0 })
    return data || []
  } catch (error) {
    console.error('❌ Exception fetching daily revenue trend:', error)
    return []
  }
}

/**
 * Get top selling products data for bar chart
 */
export async function getTopSellingProducts(
  startDate?: string,
  endDate?: string,
  branchFilter?: string,
  limit: number = 10
): Promise<TopProduct[] | null> {
  try {
    console.log('🏆 Fetching top selling products:', { startDate, endDate, branchFilter, limit })

    const { data, error } = await supabase.rpc('get_top_selling_products', {
      start_date: startDate || '2025-01-01',
      end_date: endDate || formatDateLocal(new Date()),
      branch_filter: branchFilter || null,
      limit_count: limit
    })

    if (error) {
      console.error('❌ Error fetching top selling products:', error)
      return null
    }

    console.log('✅ Top selling products loaded:', { records: data?.length || 0 })
    return data || []
  } catch (error) {
    console.error('❌ Exception fetching top selling products:', error)
    return null
  }
}

/**
 * Get top customers data for bar chart
 */
export async function getTopCustomers(
  startDate?: string,
  endDate?: string,
  branchFilter?: string,
  limit: number = 10
): Promise<TopCustomer[] | null> {
  try {
    console.log('👥 Fetching top customers:', { startDate, endDate, branchFilter, limit })

    const { data, error } = await supabase.rpc('get_top_customers_chart', {
      start_date: startDate || '2025-01-01',
      end_date: endDate || formatDateLocal(new Date()),
      branch_filter: branchFilter || null,
      limit_count: limit
    })

    if (error) {
      console.error('❌ Error fetching top customers:', error)
      return null
    }

    console.log('✅ Top customers loaded:', { records: data?.length || 0 })
    return data || []
  } catch (error) {
    console.error('❌ Exception fetching top customers:', error)
    return null
  }
}

/**
 * Get monthly revenue comparison data for line chart
 */
export async function getMonthlyRevenueComparison(
  startDate?: string,
  endDate?: string,
  branchFilter?: string
): Promise<MonthlyComparison[] | null> {
  try {
    console.log('📊 Fetching monthly revenue comparison:', { startDate, endDate, branchFilter })

    const { data, error } = await supabase.rpc('get_monthly_revenue_comparison', {
      start_date: startDate || '2025-01-01',
      end_date: endDate || formatDateLocal(new Date()),
      branch_filter: branchFilter || null
    })

    if (error) {
      console.error('❌ Error fetching monthly revenue comparison:', error)
      return null
    }

    console.log('✅ Monthly revenue comparison loaded:', { records: data?.length || 0 })
    return data || []
  } catch (error) {
    console.error('❌ Exception fetching monthly revenue comparison:', error)
    return null
  }
}

/**
 * Get branch performance data for comparison chart
 */
export async function getBranchPerformance(
  startDate?: string,
  endDate?: string
): Promise<BranchPerformance[] | null> {
  try {
    console.log('🏢 Fetching branch performance:', { startDate, endDate })

    const { data, error } = await supabase.rpc('get_branch_performance_chart', {
      start_date: startDate || '2025-01-01',
      end_date: endDate || new Date().toISOString().split('T')[0]
    })

    if (error) {
      console.error('❌ Error fetching branch performance:', error)
      return null
    }

    console.log('✅ Branch performance loaded:', { records: data?.length || 0 })
    return data || []
  } catch (error) {
    console.error('❌ Exception fetching branch performance:', error)
    return null
  }
}

/**
 * Get profit margin distribution for pie chart
 */
export async function getProfitMarginDistribution(
  startDate?: string,
  endDate?: string,
  branchFilter?: string,
  analysisType: 'products' | 'customers' = 'products'
): Promise<ProfitMarginDistribution[] | null> {
  try {
    console.log('📊 Fetching profit margin distribution:', { startDate, endDate, branchFilter, analysisType })

    const { data, error } = await supabase.rpc('get_profit_margin_distribution', {
      start_date: startDate || '2025-01-01',
      end_date: endDate || formatDateLocal(new Date()),
      branch_filter: branchFilter || null,
      analysis_type: analysisType
    })

    if (error) {
      console.error('❌ Error fetching profit margin distribution:', error)
      return null
    }

    console.log('✅ Profit margin distribution loaded:', { records: data?.length || 0 })
    return data || []
  } catch (error) {
    console.error('❌ Exception fetching profit margin distribution:', error)
    return null
  }
}

/**
 * Get weekly performance data for heatmap
 */
export async function getWeeklyPerformance(
  startDate?: string,
  endDate?: string,
  branchFilter?: string
): Promise<WeeklyPerformance[] | null> {
  try {
    console.log('📅 Fetching weekly performance:', { startDate, endDate, branchFilter })

    const { data, error } = await supabase.rpc('get_weekly_performance_heatmap', {
      start_date: startDate || '2025-01-01',
      end_date: endDate || formatDateLocal(new Date()),
      branch_filter: branchFilter || null
    })

    if (error) {
      console.error('❌ Error fetching weekly performance:', error)
      return null
    }

    console.log('✅ Weekly performance loaded:', { records: data?.length || 0 })
    return data || []
  } catch (error) {
    console.error('❌ Exception fetching weekly performance:', error)
    return null
  }
}

/**
 * Get stock by warehouse data for pie chart
 */
export async function getStockByWarehouse(): Promise<StockByWarehouse[] | null> {
  try {
    console.log('🏪 Fetching stock by warehouse')

    // Try the chart function first
    let { data, error } = await supabase.rpc('get_stock_by_warehouse_chart')

    // If the function doesn't exist, create fallback data from existing stock data
    if (error && error.message?.includes('function') && error.message?.includes('does not exist')) {
      console.log('⚠️ Stock chart function does not exist, creating fallback data from zoho_stock_summary')
      
      // Get data from existing stock view (including negative quantities for accurate calculations)
      const { data: rawData, error: fallbackError } = await supabase
        .from('zoho_stock_summary')
        .select('*')
        .not('Warehouse', 'is', null)
        .not('Name', 'is', null)
        // Removed .gt('Quantity', 0) to include negative stock movements
      
      if (fallbackError) {
        console.error('❌ Fallback stock query failed:', fallbackError)
        return []
      }
      
      if (!rawData || rawData.length === 0) {
        console.log('⚠️ No fallback stock data available')
        return []
      }
      
      // Aggregate data by warehouse
      const warehouseMap = new Map<string, {
        total_stock_value: number
        total_stock_value_with_vat: number
        product_count: number
        total_quantity: number
        unit_costs: number[]
      }>()
      
      rawData.forEach(row => {
        const warehouse = row['Warehouse'] || row['Location']
        if (!warehouse) return
        
        const stockValue = Number(row['Stock Value'] || row['Value']) || 0
        const stockValueWithVat = Number(row['Stock Value with VAT'] || row['Value with VAT'] || row['Stock Value'] || row['Value']) || 0
        const quantity = Number(row['Quantity'] || row['Stock Quantity'] || row['Qty'] || row['Available']) || 0
        const unitCost = Number(row['Unit Cost'] || row['Cost']) || 0
        
        if (!warehouseMap.has(warehouse)) {
          warehouseMap.set(warehouse, {
            total_stock_value: 0,
            total_stock_value_with_vat: 0,
            product_count: 0,
            total_quantity: 0,
            unit_costs: []
          })
        }
        
        const warehouseData = warehouseMap.get(warehouse)!
        warehouseData.total_stock_value += stockValue
        warehouseData.total_stock_value_with_vat += stockValueWithVat
        warehouseData.product_count += 1
        warehouseData.total_quantity += quantity
        if (unitCost > 0) warehouseData.unit_costs.push(unitCost)
      })
      
      // Convert to chart data format
      data = Array.from(warehouseMap.entries()).map(([warehouse, values]) => ({
        warehouse_name: warehouse,
        total_stock_value: values.total_stock_value,
        total_stock_value_with_vat: values.total_stock_value_with_vat,
        product_count: values.product_count,
        total_quantity: values.total_quantity,
        avg_unit_cost: values.unit_costs.length > 0 ? 
          values.unit_costs.reduce((sum, cost) => sum + cost, 0) / values.unit_costs.length : 0
      })).sort((a, b) => b.total_stock_value - a.total_stock_value)
      
      error = null
    }

    if (error) {
      console.error('❌ Error fetching stock by warehouse:', error)
      return []
    }

    console.log('✅ Stock by warehouse loaded:', { records: data?.length || 0 })
    return data || []
  } catch (error) {
    console.error('❌ Exception fetching stock by warehouse:', error)
    return []
  }
}

// =============================================================================
// FILTER OPTIONS FUNCTIONS (for dropdown filters)
// =============================================================================

export interface FilterOption {
  value: string
  label: string
}

/**
 * Get all unique items for dropdown filter (2025 data only)
 */
export async function getItemFilterOptions(
  startDate?: string,
  endDate?: string,
  branchFilters?: string[]
): Promise<FilterOption[]> {
  try {
    console.log('📋 Fetching item filter options (2025 only):', { startDate, endDate, branchFilters })

    // Try 2025 function first, fallback to original if it doesn't exist
    let { data, error } = await supabase.rpc('get_item_filter_options_2025', {
      start_date: startDate || '2025-01-01',
      end_date: endDate || formatDateLocal(new Date()),
      branch_filters: (branchFilters && branchFilters.length > 0) ? branchFilters : null
    })

    // If 2025 function doesn't exist, try the original function
    if (error) {
      console.log('⚠️ get_item_filter_options_2025 failed, trying original function:', error?.message)
      const fallback = await supabase.rpc('get_item_filter_options', {
        start_date: startDate || null,
        end_date: endDate || null,
        branch_filter: branchFilters && branchFilters.length === 1 ? branchFilters[0] : null
      })
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      console.error('❌ Error fetching item filter options:', error)
      return []
    }

    if (!data) return []

    const options = data.map((item: { item_name: string }) => ({
      value: item.item_name,
      label: item.item_name
    }))

    console.log('✅ Item filter options loaded:', { count: options.length })
    return options
  } catch (error) {
    console.error('❌ Exception fetching item filter options:', error)
    return []
  }
}

/**
 * Get all unique customers for dropdown filter (2025 data only)
 */
export async function getCustomerFilterOptions(
  startDate?: string,
  endDate?: string,
  branchFilters?: string[]
): Promise<FilterOption[]> {
  try {
    console.log('👥 Fetching customer filter options (2025 only):', { startDate, endDate, branchFilters })

    // Convert branch names to location IDs for indexed filtering
    const locationIds = branchFilters && branchFilters.length > 0
      ? await convertBranchNamesToLocationIds(branchFilters)
      : null

    // Try optimized 2025 function with location_ids parameter
    let { data, error } = await supabase.rpc('get_customer_filter_options_2025', {
      p_start_date: startDate || '2025-01-01',
      p_end_date: endDate || formatDateLocal(new Date()),
      p_location_ids: locationIds
    })

    // If 2025 function doesn't exist, try the original function
    if (error) {
      console.log('⚠️ get_customer_filter_options_2025 failed, trying original function:', error?.message)
      const fallback = await supabase.rpc('get_customer_filter_options', {
        start_date: startDate || null,
        end_date: endDate || null,
        branch_filter: branchFilters && branchFilters.length === 1 ? branchFilters[0] : null
      })
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      console.error('❌ Error fetching customer filter options:', error)
      return []
    }

    if (!data) return []

    const options = data.map((customer: { customer_name: string }) => ({
      value: customer.customer_name,
      label: customer.customer_name
    }))

    console.log('✅ Customer filter options loaded:', { count: options.length })
    return options
  } catch (error) {
    console.error('❌ Exception fetching customer filter options:', error)
    return []
  }
}

/**
 * Get all unique invoice numbers for dropdown filter (2025 data only)
 */
export async function getInvoiceFilterOptions(
  startDate?: string,
  endDate?: string,
  branchFilters?: string[]
): Promise<FilterOption[]> {
  try {
    console.log('📄 Fetching invoice filter options (2025 only):', { startDate, endDate, branchFilters })

    // Convert branch names to location IDs for indexed filtering
    const locationIds = branchFilters && branchFilters.length > 0
      ? await convertBranchNamesToLocationIds(branchFilters)
      : null

    // Try optimized 2025 function with location_ids parameter
    let { data, error } = await supabase.rpc('get_invoice_filter_options_2025', {
      p_start_date: startDate || '2025-01-01',
      p_end_date: endDate || formatDateLocal(new Date()),
      p_location_ids: locationIds
    })

    // If 2025 function doesn't exist, try the original function
    if (error) {
      console.log('⚠️ get_invoice_filter_options_2025 failed, trying original function:', error?.message)
      const fallback = await supabase.rpc('get_invoice_filter_options', {
        start_date: startDate || null,
        end_date: endDate || null,
        branch_filter: branchFilters && branchFilters.length === 1 ? branchFilters[0] : null
      })
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      console.error('❌ Error fetching invoice filter options:', error)
      return []
    }

    if (!data) return []

    // The RPC function returns invoice_no field
    const options = data.map((invoice: { invoice_no: string }) => ({
      value: invoice.invoice_no,
      label: invoice.invoice_no
    }))

    console.log('✅ Invoice filter options loaded:', { count: options.length, sample: options.slice(0, 3) })
    return options
  } catch (error) {
    console.error('❌ Exception fetching invoice filter options:', error)
    return []
  }
}

/**
 * Get all unique warehouse names for dropdown filter
 */
export async function getWarehouseFilterOptions(): Promise<FilterOption[]> {
  try {
    console.log('🏪 Fetching warehouse filter options')

    // Try RPC function first, fallback to direct query if it doesn't exist
    let { data, error } = await supabase.rpc('get_warehouse_filter_options')

    // If RPC function doesn't exist, query the stock_report_view directly
    if (error) {
      console.log('⚠️ get_warehouse_filter_options failed, trying stock_report_view:', error?.message)
      const fallback = await supabase
        .from('stock_report_view')
        .select('warehouse')
        .not('warehouse', 'is', null)
        .order('warehouse', { ascending: true })

      if (fallback.data) {
        console.log('📦 Raw warehouse data:', fallback.data.slice(0, 3))
        console.log('📦 First item keys:', Object.keys(fallback.data[0] || {}))

        // Remove duplicates and format for options, filter out empty/null values
        const uniqueWarehouses = [...new Set(
          fallback.data
            .map(item => item.warehouse)
            .filter(w => w && w.trim().length > 0)
        )]
        console.log('📦 Unique warehouses:', uniqueWarehouses)
        data = uniqueWarehouses.map(warehouse => ({ warehouse_name: warehouse }))
        console.log('📦 Formatted data:', data)
      }
      error = fallback.error
    }

    if (error) {
      console.error('❌ Error fetching warehouse filter options:', error)
      return []
    }

    if (!data) return []

    console.log('📦 Data before mapping:', data)

    // RPC function returns branch_name, not warehouse_name
    const options = data.map((warehouse: { branch_name: string }) => ({
      value: warehouse.branch_name,
      label: warehouse.branch_name
    }))

    console.log('✅ Warehouse filter options loaded:', { count: options.length, options })
    return options
  } catch (error) {
    console.error('❌ Exception fetching warehouse filter options:', error)
    return []
  }
}

// =============================================================================
// INVOICE ITEMS API
// =============================================================================

export interface InvoiceItem {
  item_name: string
  quantity: number
  unit_price: number
  sale_price: number
  unit_cost: number
  cost: number
  unit_profit: number
  profit: number
  profit_percentage: number
}

/**
 * Get detailed items for a specific invoice with profit calculations
 */
export async function getInvoiceItems(invoiceNumber: string): Promise<InvoiceItem[] | null> {
  try {
    console.log('📋 Fetching invoice items for invoice:', invoiceNumber)

    const { data, error } = await supabase.rpc('get_invoice_items_with_profit', {
      invoice_number: invoiceNumber
    })

    if (error) {
      console.error('❌ Error fetching invoice items:', error)
      return null
    }

    if (!data) {
      console.log('⚠️ No items found for invoice:', invoiceNumber)
      return []
    }

    console.log('✅ Invoice items loaded:', { 
      invoice: invoiceNumber, 
      itemCount: data.length,
      totalProfit: data.reduce((sum: number, item: Record<string, unknown>) => sum + ((item.profit as number) || 0), 0)
    })
    
    return data
  } catch (error) {
    console.error('❌ Exception fetching invoice items:', error)
    return null
  }
}

// =============================================================================
// VAT RETURN API
// =============================================================================

export interface VATInvoice {
  invoice_number: string
  invoice_date: string
  customer_name: string
  branch_name: string
  subtotal: number
  vat_amount: number
  total: number
}

export interface VATCreditNote {
  credit_note_number: string
  credit_note_date: string
  customer_name: string
  branch_name: string
  subtotal: number
  vat_amount: number
  total: number
}

export interface VATBill {
  bill_number: string
  bill_date: string
  vendor_name: string
  branch_name: string
  subtotal: number
  vat_amount: number
  total: number
}

export interface VATReturnSummary {
  total_output_vat: number
  total_credit_vat: number
  total_input_vat: number
  net_vat_payable: number
}

export interface VATReturnData {
  invoices: VATInvoice[]
  credit_notes: VATCreditNote[]
  bills: VATBill[]
  summary: VATReturnSummary
}

export interface VATAvailableMonth {
  month: number
  year: number
  transaction_count: number
}

/**
 * Get VAT return data for a specific date range
 */
export async function getVATReturn(
  startDate: string,
  endDate: string,
  branchFilters?: string[]  // Changed to accept array of branch names
): Promise<VATReturnData | null> {
  try {
    console.log('💰 Fetching VAT return data:', { startDate, endDate, branchFilters })

    // Database function supports multiple branches via p_branch_names parameter (text[])
    // Pass the entire array to support multiple branch selection
    const { data, error } = await supabase.rpc('get_vat_return', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_branch_names: branchFilters && branchFilters.length > 0 ? branchFilters : null
    })

    if (error) {
      console.error('❌ Error fetching VAT return:', error)
      return null
    }

    if (!data) {
      console.warn('⚠️ No VAT return data returned')
      return {
        invoices: [],
        credit_notes: [],
        bills: [],
        summary: {
          total_output_vat: 0,
          total_credit_vat: 0,
          total_input_vat: 0,
          net_vat_payable: 0
        }
      }
    }

    // The RPC function returns JSON with snake_case keys
    const vatData = data as Record<string, unknown>

    // Extract summary first (it's nested in the response)
    const summaryData = (vatData.summary as Record<string, unknown>) || {}

    const result: VATReturnData = {
      invoices: (vatData.invoices as VATInvoice[]) || [],
      credit_notes: (vatData.credit_notes as VATCreditNote[]) || [],
      bills: (vatData.bills as VATBill[]) || [],
      summary: {
        total_output_vat: (summaryData.total_output_vat as number) || 0,
        total_credit_vat: (summaryData.total_credit_vat as number) || 0,
        total_input_vat: (summaryData.total_input_vat as number) || 0,
        net_vat_payable: (summaryData.net_vat_payable as number) || 0
      }
    }

    console.log('✅ VAT return loaded:', {
      invoices: result.invoices.length,
      creditNotes: result.credit_notes.length,
      bills: result.bills.length,
      netVatPayable: result.summary.net_vat_payable
    })

    return result
  } catch (error) {
    console.error('❌ Exception fetching VAT return:', error)
    return null
  }
}

/**
 * Get available months with VAT transactions (current year only)
 */
export async function getVATAvailableMonths(): Promise<VATAvailableMonth[]> {
  try {
    console.log('📅 Fetching available VAT months')

    const { data, error } = await supabase.rpc('get_vat_available_months')

    if (error) {
      console.error('❌ Error fetching available VAT months:', error)
      return []
    }

    if (!data || !Array.isArray(data)) {
      console.warn('⚠️ No available VAT months returned')
      return []
    }

    // Map the response to match our interface
    const months: VATAvailableMonth[] = data.map((item: Record<string, unknown>) => ({
      month: item.month as number,
      year: item.year as number,
      transaction_count: item.transactionCount as number
    }))

    console.log('✅ Available VAT months loaded:', { count: months.length })
    return months
  } catch (error) {
    console.error('❌ Exception fetching available VAT months:', error)
    return []
  }
}

// =============================================================================
// CSV EXPORT FUNCTIONS - Database Direct Export
// =============================================================================

/**
 * Export all invoices for CSV with filters - no pagination limit
 */
export async function exportInvoicesForCSV(
  startDate?: string,
  endDate?: string,
  branchFilter?: string,
  customerFilter?: string,
  invoiceFilter?: string
): Promise<OptimizedInvoice[] | null> {
  try {
    console.log('📤 Exporting invoices for CSV:', { startDate, endDate, branchFilter, customerFilter, invoiceFilter })
    
    // Use existing function with high page limit to get all records
    const result = await getOptimizedProfitByInvoice(
      startDate,
      endDate,
      branchFilter,
      customerFilter,
      invoiceFilter,
      50000, // High page limit to get all records
      0      // Start from beginning
    )
    
    if (!result) {
      console.error('❌ Failed to fetch invoices for export')
      return null
    }
    
    console.log('✅ Invoices exported for CSV:', { count: result.data.length })
    return result.data
  } catch (error) {
    console.error('❌ Error exporting invoices for CSV:', error)
    return null
  }
}

/**
 * Export invoices with their items for CSV
 */
export async function exportInvoicesWithItemsForCSV(
  startDate?: string,
  endDate?: string,
  branchFilter?: string,
  customerFilter?: string,
  invoiceFilter?: string
): Promise<{ invoices: OptimizedInvoice[], itemsMap: Map<string, InvoiceItem[]> } | null> {
  try {
    console.log('📤 Exporting invoices with items for CSV:', { startDate, endDate, branchFilter, customerFilter, invoiceFilter })
    
    // First get all invoices
    const invoices = await exportInvoicesForCSV(startDate, endDate, branchFilter, customerFilter, invoiceFilter)
    if (!invoices) {
      return null
    }
    
    // Then batch fetch items for all invoices
    const itemsMap = new Map<string, InvoiceItem[]>()
    const batchSize = 10 // Process 10 invoices at a time to avoid overwhelming the API
    
    for (let i = 0; i < invoices.length; i += batchSize) {
      const batch = invoices.slice(i, i + batchSize)
      
      // Process batch in parallel
      const batchPromises = batch.map(async (invoice) => {
        const items = await getInvoiceItems(invoice.invoice_no)
        if (items && items.length > 0) {
          itemsMap.set(invoice.invoice_no, items)
        }
      })
      
      await Promise.all(batchPromises)
      
      // Small delay between batches to be nice to the API
      if (i + batchSize < invoices.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    console.log('✅ Invoices with items exported for CSV:', { 
      invoiceCount: invoices.length, 
      itemsCount: itemsMap.size 
    })
    
    return { invoices, itemsMap }
  } catch (error) {
    console.error('❌ Error exporting invoices with items for CSV:', error)
    return null
  }
}