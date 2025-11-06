// TypeScript types for Customer Aging KPIs

export interface CustomerAgingSummaryKPIs {
  total_customers_with_balance: number
  total_receivables: string
  avg_balance_per_customer: string
  total_outstanding_invoices: number
  
  // Current (0-30 days)
  current_customers_count: number
  current_amount: string
  current_percentage: string
  
  // Past Due 31-60 days
  past_due_31_60_count: number
  past_due_31_60_amount: string
  past_due_31_60_percentage: string
  
  // Past Due 61-90 days
  past_due_61_90_count: number
  past_due_61_90_amount: string
  past_due_61_90_percentage: string
  
  // Past Due 91-180 days
  past_due_91_180_count: number
  past_due_91_180_amount: string
  past_due_91_180_percentage: string
  
  // Over 180 days (High Risk)
  over_180_count: number
  over_180_amount: string
  over_180_percentage: string
  
  // Risk assessment
  high_risk_percentage: string
  avg_invoices_per_customer: string
  report_date: string
}

export interface TopOverdueCustomer {
  customer_id: string
  customer_name: string
  display_name: string | null
  company_name: string | null
  sales_person: string
  outstanding_amount: number
  total_invoices: number
  last_invoice_date: string | null
  days_since_last_invoice: number | null
  risk_category: 'Current' | 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Very High Risk'
  
  // Aging breakdown
  current_amount: number
  past_due_31_60: number
  past_due_61_90: number
  past_due_91_180: number
  past_due_over_180: number
  
  oldest_aging_bucket: string
  customer_status: string
  collection_priority: 1 | 2 | 3 | 4 | 5
}

export interface RiskCategoryDistribution {
  risk_category: string
  category_order: number
  risk_level: 'Low' | 'Low-Medium' | 'Medium' | 'High' | 'Very High'
  customer_count: number
  total_amount: string
  chart_color: string
}

export interface BranchPerformance {
  branch_name: string
  total_customers: number
  customers_with_balance: number
  total_invoices: number
  outstanding_invoices: number
  total_receivables: string
  avg_balance_per_customer: string
  
  // Aging breakdown by branch
  current_amount: string
  past_due_31_60: string
  past_due_61_90: string
  past_due_91_180: string
  past_due_over_180: string
  
  // Performance metrics
  high_risk_percentage: string
  customers_with_balance_percentage: string
  overdue_percentage: string
  receivables_rank: number
  performance_rank: number
}

// Chart data interfaces for frontend components
export interface AgingChartData {
  name: string
  value: number
  percentage: number
  color: string
  customers: number
}

export interface KPICardData {
  title: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  subtitle?: string
  icon?: React.ComponentType<{ className?: string }>
}