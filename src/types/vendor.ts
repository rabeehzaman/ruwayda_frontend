// Vendor Dashboard Types and Interfaces

// Base vendor information
export interface VendorBase {
  vendor_id: string
  vendor_name?: string
  company_name?: string
  vendor_status?: string
}

// KPI Cards Data - Enhanced with actual payment data
export interface VendorKPIs {
  outstanding_bills: number
  open_bills: number
  overdue_bills: number
  avg_payment_days: number // Now based on actual payment dates
  overdue_percentage: number
  active_vendors_this_month: number
  payment_success_rate: number // Now based on actual payments vs billed amounts
  total_bills: number
  paid_bills: number // Now based on bills that actually have payments
  total_outstanding_amount: number // NEW: Actual outstanding amount (bills - payments)
  total_billed_amount: number // NEW: Total amount billed
  total_paid_amount: number // NEW: Total amount actually paid
}

// Vendor Performance Scorecard - Enhanced with payment data
export interface VendorPerformance extends VendorBase {
  performance_score: number
  total_bills: number
  avg_payment_days: number // Now based on actual payment dates
  overdue_percentage: number
  business_percentage: number // Now based on actual billed amounts
  payment_success_rate: number // Now based on actual payments vs billed amounts
  vendor_status: '🟢 Excellent' | '🟡 Good' | '🟠 Average' | '🔴 Needs Attention'
  payment_reliability_score?: number // NEW: Payment reliability score
  outstanding_amount?: number // NEW: Actual outstanding amount
}

// Priority Alerts
export interface VendorAlert {
  alert_level: 'URGENT' | 'WARNING' | 'INFO'
  icon: '🔴' | '🟡' | '🔵'
  alert_message: string
  category: string
  action?: string
}

export interface ProblemVendor extends VendorBase {
  risk_level: string
  overdue_percentage: number
  total_bills: number
  recommended_action: string
  outstanding_amount?: number // NEW: Actual outstanding amount
  payment_completion_rate?: number // NEW: Payment completion rate based on actual payments
}

// Financial Insights - Enhanced with actual cash flow data
export interface VendorFinancialInsight extends VendorBase {
  total_spend_ytd: number // Based on actual billed amounts
  total_paid_ytd?: number // NEW: Actual cash outflow
  outstanding_amount?: number // NEW: Actual outstanding amount
  avg_order_value: number
  last_bill_date: string
  last_payment_date?: string // NEW: Last payment date
  days_since_last_bill: number
  days_since_last_payment?: number // NEW: Days since last payment
  activity_status: 'Very Recent' | 'Recent' | 'Moderate' | 'Inactive'
  credit_terms_days: number
  recent_payment_days: number // Now based on actual payment dates
  historical_payment_days: number // Now based on actual payment dates
  payment_trend: '⬇️ Improving' | '⬆️ Deteriorating' | '➡️ Stable'
  payment_completion_rate?: number // NEW: Actual payments vs billed amounts
  cash_conversion_days?: number // NEW: Average days from bill to payment
  payment_velocity?: number // NEW: Recent payment frequency
  bills_with_payments?: number // NEW: Bills that actually have payments
}

// Payment Behavior Trends - Enhanced with actual payment data
export interface VendorPaymentTrend {
  vendor_id: string
  vendor_name?: string // NEW: Include vendor name
  year: string
  month: string
  month_key: string
  avg_payment_days: number // Now based on actual payment dates
  bill_count: number
  billed_amount?: number // NEW: Billed amount for the month
  paid_amount?: number // NEW: Paid amount for the month
  payment_completion_rate?: number // NEW: Payment completion rate
}

export interface OverallPaymentTrend {
  year: string
  month: string
  month_key: string
  avg_payment_days: number // Now based on actual payment dates
  total_bills: number
  overdue_bills: number
  overdue_rate: number
  total_billed_amount?: number // NEW: Total billed amount
  total_paid_amount?: number // NEW: Total actually paid
  payment_completion_rate?: number // NEW: Payment completion rate
  bills_with_payments?: number // NEW: Bills that actually have payments
}

// Vendor Concentration
export interface VendorConcentration {
  vendor_label: string
  business_percentage: number
  total_spend: number
  total_paid?: number
  payment_completion_rate?: number
  vendor_count: number
  chart_color: string
}

export interface ConcentrationMetric {
  metric: string
  percentage: number
}

// Vendor Relationships
export interface VendorRelationship extends VendorBase {
  total_bills: number
  active_months: number
  first_bill_date: string
  last_bill_date: string
  days_since_last_bill: number
  avg_payment_days: number
  payment_success_rate: number
  overdue_rate: number
  vendor_category: 'Strategic Partner' | 'Regular Supplier' | 'Occasional Vendor' | 'New/Sporadic Vendor'
  relationship_status: 'Active' | 'Recently Active' | 'Dormant' | 'Inactive'
  relationship_trend: '📈 Growing' | '➡️ Stable' | '📉 Declining' | '⚠️ At Risk' | '🔍 Monitor'
  risk_level: 'Low' | 'Medium' | 'High'
}

// Operational Metrics
export interface VendorPOCompliance extends VendorBase {
  total_bills: number
  bills_with_po: number
  po_compliance_rate: number
  missing_po_count: number
  po_compliance_category: 'Excellent' | 'Good' | 'Poor' | 'Critical'
}

export interface VendorProductDiversity extends VendorBase {
  total_items: number
  unique_products: number
  diversity_ratio: number
  account_categories_used: number
  avg_quantity_per_item: number
  specialization_type: 'Highly Diverse' | 'Moderately Diverse' | 'Specialized' | 'Highly Specialized'
}

// AI Action Recommendations
export interface VendorActionRecommendation extends VendorBase {
  total_bills: number
  overdue_percentage: number
  business_percentage: number
  total_spend: number
  priority_score: number
  recommended_action: string
  expected_impact: string
  implementation_timeline: string
  resource_requirements: string
}

// Chart Data Types
export interface ChartDataPoint {
  name: string
  value: number
  color?: string
}

export interface TrendChartData {
  labels: string[]
  datasets: {
    label: string
    data: (number | null)[]
    borderColor: string
    backgroundColor?: string
    tension?: number
  }[]
}

// API Response Types
export interface VendorAPIResponse<T> {
  data: T | null
  loading: boolean
  error: string | null
}

// Filter and Search Types
export interface VendorFilters {
  status?: string
  category?: string
  risk_level?: string
  date_range?: {
    start: string
    end: string
  }
  search_term?: string
}

// Summary Statistics
export interface VendorSummaryStats {
  total_vendors: number
  strategic_partners: number
  regular_suppliers: number
  occasional_vendors: number
  new_sporadic_vendors: number
  high_risk_vendors: number
  total_outstanding_amount: number
  avg_payment_days_all: number
}