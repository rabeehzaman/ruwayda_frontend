export interface ProfitAnalysisViewCurrent {
  'Inv No'?: string
  'Inv Date'?: string
  'Item'?: string
  'Qty'?: number
  'Sale Price'?: number
  'SaleWithVAT'?: number
  'Cost'?: number
  'Profit'?: number
  'Profit %'?: number
  'Customer Name'?: string
  'Branch Name'?: string
  'Unit Price'?: number
  'Unit Cost'?: number
  'Unit Profit'?: number
  'Sales Person Name'?: string
  'Invoice Status'?: string
}

export interface DashboardKPIs {
  totalRevenue: number
  totalProfit: number
  profitMargin: number
  taxableSales: number
  totalQuantity: number
  totalCost: number
  averageOrderValue: number
  totalInvoices: number
  // New KPIs
  grossProfit: number
  grossProfitPercentage: number
  totalStockValue: number
  dailyAvgSales: number
  totalPayables: number
  visits: number // count of invoices
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
  category?: string
}

export interface TableRow {
  [key: string]: string | number | null | undefined
}

export interface CustomerBalanceAging {
  customer_id: string
  customer_name: string
  display_name: string
  company_name?: string
  customer_owner: string
  customer_owner_name?: string
  customer_owner_email?: string
  customer_owner_name_custom: string
  total_balance: number
  current_0_30: number
  past_due_31_60: number
  past_due_61_90: number
  past_due_91_180: number
  past_due_over_180: number
  total_invoices: number
  last_invoice_date: string
  customer_status: string
}

export interface VendorBalanceAging {
  "Vendor ID": string
  "Vendor Name": string
  "Company Name": string
  "Vendor Status": string
  "Vendor Currency": string
  "Currency": string
  "Total Outstanding": number
  "Current (0-30 days)": number
  "31-60 Days": number
  "61-90 Days": number
  "91-120 Days": number
  "Over 120 Days": number
  "Outstanding Bills Count": number
  "Avg Days Outstanding": number
  "Oldest Due Date": string
  "Last Bill Date": string
  "Risk Category": string
}