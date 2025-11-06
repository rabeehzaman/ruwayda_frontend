import { supabase } from './supabase'
import type { ProfitAnalysisViewCurrent, DashboardKPIs, ChartDataPoint } from '@/types/database'

// Stock summary type for zoho_stock_summary view
interface StockSummary {
  Name: string
  Warehouse: string
  Unit: string
  'Stock Qty': number
  'Stock in Pieces': number
  'Current Stock Value': number
  'Stock Value with VAT': number
}

export async function fetchProfitAnalysisData(): Promise<ProfitAnalysisViewCurrent[]> {
  try {
    const { data, error } = await supabase
      .from('profit_analysis_view_current')
      .select('*')
      .order('Inv Date', { ascending: false })

    if (error) {
      console.error('Error fetching profit analysis data:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching profit analysis data:', error)
    return []
  }
}

export async function fetchProfitAnalysisDataByDateRange(
  startDate: string,
  endDate: string
): Promise<ProfitAnalysisViewCurrent[]> {
  try {
    const { data, error } = await supabase
      .from('profit_analysis_view_current')
      .select('*')
      .gte('Inv Date', startDate)
      .lte('Inv Date', endDate)
      .order('Inv Date', { ascending: true })

    if (error) {
      console.error('Error fetching profit analysis data by date range:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching profit analysis data by date range:', error)
    return []
  }
}

export async function calculateDashboardKPIs(data?: ProfitAnalysisViewCurrent[], dateRange?: { from: Date; to: Date }): Promise<DashboardKPIs> {
  try {
    const profitData = data || await fetchProfitAnalysisData()
    
    // Fetch stock data for total stock value
    const stockData = await fetchStockSummaryData()
    const totalStockValue = stockData.reduce((sum, item) => sum + (item['Stock Value with VAT'] || 0), 0)
    
    if (!profitData.length) {
      return {
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
        totalStockValue,
        dailyAvgSales: 0,
        totalPayables: 0, // Note: This would need actual payables data
        visits: 0,
      }
    }

    // Calculate KPIs from the actual data structure
    const totalRevenue = profitData.reduce((sum, item) => sum + (item['SaleWithVAT'] || 0), 0)
    const totalProfit = profitData.reduce((sum, item) => sum + (item['Profit'] || 0), 0)
    const taxableSales = profitData.reduce((sum, item) => sum + (item['Sale Price'] || 0), 0)
    const totalQuantity = profitData.reduce((sum, item) => sum + (item['Qty'] || 0), 0)
    const totalCost = profitData.reduce((sum, item) => sum + (item['Cost'] || 0), 0)
    const totalInvoices = new Set(profitData.map(item => item['Inv No'])).size
    
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    const averageOrderValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0

    // Calculate new KPIs
    const grossProfit = taxableSales - totalCost // Gross profit = Sale Price - Cost
    const grossProfitPercentage = taxableSales > 0 ? (grossProfit / taxableSales) * 100 : 0
    
    // Calculate daily average sales
    let dailyAvgSales = 0
    if (dateRange) {
      const timeDiff = dateRange.to.getTime() - dateRange.from.getTime()
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) || 1
      dailyAvgSales = taxableSales / daysDiff
    } else {
      // If no date range, use 30 days as default
      dailyAvgSales = taxableSales / 30
    }
    
    const visits = totalInvoices // Visits = count of invoices

    return {
      totalRevenue,
      totalProfit,
      profitMargin,
      taxableSales,
      totalQuantity,
      totalCost,
      averageOrderValue,
      totalInvoices,
      grossProfit,
      grossProfitPercentage,
      totalStockValue,
      dailyAvgSales,
      totalPayables: 0, // TODO: Need actual payables data source
      visits,
    }
  } catch (error) {
    console.error('Error calculating dashboard KPIs:', error)
    return {
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
    }
  }
}

export function transformDataForCharts(data: ProfitAnalysisViewCurrent[]): {
  revenueChart: ChartDataPoint[]
  profitChart: ChartDataPoint[]
  marginChart: ChartDataPoint[]
} {
  console.log(`📊 Transforming ${data.length} records for charts`)
  
  // Group data by MONTH instead of day
  const groupedData = data.reduce((acc, item) => {
    const invDate = item['Inv Date'] || ''
    if (!invDate) return acc
    
    // Convert to YYYY-MM format for monthly grouping
    const monthKey = invDate.substring(0, 7) // "2024-07-26" -> "2024-07"
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        totalRevenue: 0,
        totalProfit: 0,
        totalSales: 0
      }
    }
    
    acc[monthKey].totalRevenue += item['SaleWithVAT'] || 0
    acc[monthKey].totalProfit += item['Profit'] || 0
    acc[monthKey].totalSales += item['Sale Price'] || 0
    return acc
  }, {} as Record<string, { totalRevenue: number; totalProfit: number; totalSales: number }>)

  const sortedMonths = Object.keys(groupedData).sort()
  console.log(`📈 Grouped into ${sortedMonths.length} months:`, sortedMonths)

  const revenueChart: ChartDataPoint[] = sortedMonths.map(month => ({
    date: month,
    value: groupedData[month].totalRevenue,
    label: 'Revenue'
  }))

  const profitChart: ChartDataPoint[] = sortedMonths.map(month => ({
    date: month,
    value: groupedData[month].totalProfit,
    label: 'Profit'
  }))

  const marginChart: ChartDataPoint[] = sortedMonths.map(month => ({
    date: month,
    value: groupedData[month].totalRevenue > 0 
      ? (groupedData[month].totalProfit / groupedData[month].totalRevenue) * 100 
      : 0,
    label: 'Margin %'
  }))

  console.log('📊 Sample chart points generated:')
  console.log('Revenue:', revenueChart.slice(0, 2))
  console.log('Profit:', profitChart.slice(0, 2))

  return {
    revenueChart,
    profitChart,
    marginChart
  }
}

export async function fetchRecentAnalysisData(limit: number = 10): Promise<ProfitAnalysisViewCurrent[]> {
  try {
    const { data, error } = await supabase
      .from('profit_analysis_view_current')
      .select('*')
      .order('Inv Date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent analysis data:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching recent analysis data:', error)
    return []
  }
}

// Mock data function for development when Supabase is not accessible
export function getMockProfitAnalysisData(): ProfitAnalysisViewCurrent[] {
  const now = new Date()
  const mockData: ProfitAnalysisViewCurrent[] = []

  const products = ['SKY FLAKES CHEESE 20X10X25GM', 'BISKREM CHOCOLATE 10X24', 'OREO COOKIES 12X137G', 'MILK POWDER 400G', 'RICE 5KG BAG']
  const customers = ['Customer A', 'Customer B', 'Customer C', 'Customer D', 'Customer E']
  const branches = ['Main Branch', 'North Branch', 'South Branch', 'East Branch']
  const salesPersons = ['COUNTER SALES', 'John Doe', 'Jane Smith', 'Mike Johnson']

  for (let i = 0; i < 50; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - Math.floor(Math.random() * 30))
    const qty = Math.floor(Math.random() * 10) + 1
    const unitPrice = 5 + Math.random() * 50
    const unitCost = unitPrice * (0.6 + Math.random() * 0.3)
    const salePrice = unitPrice * qty
    const cost = unitCost * qty
    const profit = salePrice - cost
    const profitPercent = salePrice > 0 ? (profit / salePrice) * 100 : 0

    mockData.push({
      'Inv No': `INV-${String(i + 1).padStart(5, '0')}`,
      'Inv Date': date.toISOString().split('T')[0],
      'Item': products[Math.floor(Math.random() * products.length)],
      'Qty': qty,
      'Sale Price': Number(salePrice.toFixed(2)),
      'SaleWithVAT': Number((salePrice * 1.15).toFixed(2)),
      'Cost': Number(cost.toFixed(2)),
      'Profit': Number(profit.toFixed(2)),
      'Profit %': Number(profitPercent.toFixed(2)),
      'Customer Name': customers[Math.floor(Math.random() * customers.length)],
      'Branch Name': branches[Math.floor(Math.random() * branches.length)],
      'Unit Price': Number(unitPrice.toFixed(2)),
      'Unit Cost': Number(unitCost.toFixed(2)),
      'Unit Profit': Number((unitPrice - unitCost).toFixed(2)),
      'Sales Person Name': salesPersons[Math.floor(Math.random() * salesPersons.length)],
      'Invoice Status': Math.random() > 0.1 ? 'Open' : 'Closed'
    })
  }

  return mockData.sort((a, b) => (a['Inv Date'] || '').localeCompare(b['Inv Date'] || ''))
}

export async function fetchStockSummaryData(): Promise<StockSummary[]> {
  try {
    const { data, error } = await supabase
      .from('zoho_stock_summary')
      .select('*')
      .order('Name', { ascending: true })

    if (error) {
      console.error('Error fetching stock summary data:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching stock summary data:', error)
    return []
  }
}

// Export the StockSummary type for use in other components
export type { StockSummary }