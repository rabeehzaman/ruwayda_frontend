import { supabase } from './supabase'
import type {
  VendorKPIs,
  VendorPerformance,
  VendorAlert,
  ProblemVendor,
  VendorFinancialInsight,
  VendorPaymentTrend,
  OverallPaymentTrend,
  VendorConcentration,
  ConcentrationMetric,
  VendorRelationship,
  VendorPOCompliance,
  VendorProductDiversity,
  VendorActionRecommendation
} from '@/types/vendor'

/**
 * Vendor KPI Cards Data
 */
export async function getVendorKPIs(): Promise<VendorKPIs> {
  // Outstanding Bills Count
  const { data: outstandingData, error: outstandingError } = await supabase
    .from('bills')
    .select('*', { count: 'exact' })
    .in('bill_status', ['Open', 'Overdue'])

  if (outstandingError) throw outstandingError

  // Average Payment Days
  const { data: paymentData, error: paymentError } = await supabase
    .rpc('get_avg_payment_days')

  if (paymentError) throw paymentError

  // Overdue Percentage
  const { data: overdueData, error: overdueError } = await supabase
    .rpc('get_overdue_stats')

  if (overdueError) throw overdueError

  // Active Vendors This Month
  const { data: activeVendorsData, error: activeVendorsError } = await supabase
    .rpc('get_active_vendors_this_month')

  if (activeVendorsError) throw activeVendorsError

  // Payment Success Rate
  const { data: successData, error: successError } = await supabase
    .rpc('get_payment_success_rate')

  if (successError) throw successError

  return {
    outstanding_bills: outstandingData?.length || 0,
    open_bills: outstandingData?.filter(b => b.bill_status === 'Open').length || 0,
    overdue_bills: outstandingData?.filter(b => b.bill_status === 'Overdue').length || 0,
    avg_payment_days: paymentData?.[0]?.avg_payment_days || 0,
    overdue_percentage: overdueData?.[0]?.overdue_percentage || 0,
    active_vendors_this_month: activeVendorsData?.[0]?.active_vendors || 0,
    payment_success_rate: successData?.[0]?.payment_success_rate || 0,
    total_bills: (overdueData?.[0]?.total_bills || 0),
    paid_bills: (successData?.[0]?.paid_bills || 0)
  }
}

/**
 * Vendor Performance Scorecard
 */
export async function getVendorPerformanceScorecard(): Promise<VendorPerformance[]> {
  const { data, error } = await supabase.rpc('get_vendor_performance_scorecard')
  
  if (error) throw error
  
  return data || []
}

/**
 * Priority Alerts
 */
export async function getVendorAlerts(): Promise<{ alerts: VendorAlert[], problemVendors: ProblemVendor[] }> {
  const { data: alertsData, error: alertsError } = await supabase.rpc('get_vendor_alerts')
  const { data: problemData, error: problemError } = await supabase.rpc('get_problem_vendors')
  
  if (alertsError) throw alertsError
  if (problemError) throw problemError
  
  return {
    alerts: alertsData || [],
    problemVendors: problemData || []
  }
}

/**
 * Vendor Financial Insights
 */
export async function getVendorFinancialInsights(): Promise<VendorFinancialInsight[]> {
  const { data, error } = await supabase.rpc('get_vendor_financial_insights')
  
  if (error) throw error
  
  return data || []
}

/**
 * Payment Behavior Trends
 */
export async function getVendorPaymentTrends(): Promise<{
  vendorTrends: VendorPaymentTrend[]
  overallTrends: OverallPaymentTrend[]
}> {
  const { data: vendorData, error: vendorError } = await supabase.rpc('get_vendor_payment_trends')
  const { data: overallData, error: overallError } = await supabase.rpc('get_overall_payment_trends')
  
  if (vendorError) throw vendorError
  if (overallError) throw overallError
  
  return {
    vendorTrends: vendorData || [],
    overallTrends: overallData || []
  }
}

/**
 * Vendor Concentration Analysis
 */
export async function getVendorConcentration(): Promise<{
  concentrationData: VendorConcentration[]
  concentrationMetrics: ConcentrationMetric[]
}> {
  const { data: concentrationData, error: concentrationError } = await supabase.rpc('get_vendor_concentration')
  const { data: metricsData, error: metricsError } = await supabase.rpc('get_concentration_metrics')
  
  if (concentrationError) throw concentrationError
  if (metricsError) throw metricsError
  
  return {
    concentrationData: concentrationData || [],
    concentrationMetrics: metricsData || []
  }
}

/**
 * Vendor Relationship Intelligence
 */
export async function getVendorRelationships(): Promise<VendorRelationship[]> {
  const { data, error } = await supabase.rpc('get_vendor_relationships')
  
  if (error) throw error
  
  return data || []
}

/**
 * Operational Metrics
 */
export async function getVendorOperationalMetrics(): Promise<{
  poCompliance: VendorPOCompliance[]
  productDiversity: VendorProductDiversity[]
}> {
  const { data: poData, error: poError } = await supabase.rpc('get_vendor_po_compliance')
  const { data: diversityData, error: diversityError } = await supabase.rpc('get_vendor_product_diversity')
  
  if (poError) throw poError
  if (diversityError) throw diversityError
  
  return {
    poCompliance: poData || [],
    productDiversity: diversityData || []
  }
}

/**
 * AI Action Recommendations
 */
export async function getVendorActionRecommendations(): Promise<VendorActionRecommendation[]> {
  const { data, error } = await supabase.rpc('get_vendor_action_recommendations')
  
  if (error) throw error
  
  return data || []
}

/**
 * Fallback SQL queries for direct execution if RPC functions don't exist
 */

export const vendorSQLQueries = {
  // KPI Queries
  kpiQueries: {
    outstandingBills: `
      SELECT 
          COUNT(*) as outstanding_bills,
          COUNT(CASE WHEN bill_status = 'Open' THEN 1 END) as open_bills,
          COUNT(CASE WHEN bill_status = 'Overdue' THEN 1 END) as overdue_bills
      FROM bills 
      WHERE bill_status IN ('Open', 'Overdue');
    `,
    
    avgPaymentDays: `
      SELECT 
          ROUND(AVG(CAST(age_in_days AS INTEGER)), 1) as avg_payment_days
      FROM bills 
      WHERE bill_status = 'Paid' AND age_in_days IS NOT NULL;
    `,
    
    overduePercentage: `
      SELECT 
          ROUND(
              (COUNT(CASE WHEN bill_status = 'Overdue' THEN 1 END) * 100.0 / COUNT(*)), 2
          ) as overdue_percentage,
          COUNT(CASE WHEN bill_status = 'Overdue' THEN 1 END) as overdue_count,
          COUNT(*) as total_bills
      FROM bills;
    `,
    
    activeVendors: `
      SELECT 
          COUNT(DISTINCT vendor_id) as active_vendors_this_month
      FROM bills 
      WHERE TO_DATE(bill_date, 'DD Mon YYYY') >= DATE_TRUNC('month', CURRENT_DATE)
          AND vendor_id IS NOT NULL;
    `,
    
    paymentSuccessRate: `
      SELECT 
          ROUND(
              (COUNT(CASE WHEN bill_status = 'Paid' THEN 1 END) * 100.0 / COUNT(*)), 2
          ) as payment_success_rate,
          COUNT(CASE WHEN bill_status = 'Paid' THEN 1 END) as paid_bills,
          COUNT(*) as total_bills
      FROM bills;
    `
  },

  // Performance Scorecard Query
  performanceScorecard: `
    WITH vendor_metrics AS (
        SELECT 
            vendor_id,
            COUNT(*) as total_bills,
            AVG(CAST(age_in_days AS INTEGER)) as avg_payment_days,
            COUNT(CASE WHEN bill_status = 'Overdue' THEN 1 END) * 100.0 / COUNT(*) as overdue_rate,
            COUNT(*) * 100.0 / (SELECT COUNT(*) FROM bills) as business_share,
            COUNT(CASE WHEN bill_status = 'Paid' THEN 1 END) * 100.0 / COUNT(*) as payment_success_rate
        FROM bills 
        WHERE vendor_id IS NOT NULL
        GROUP BY vendor_id
    )
    SELECT 
        vendor_id,
        total_bills,
        ROUND(avg_payment_days, 1) as avg_payment_days,
        ROUND(overdue_rate, 1) as overdue_percentage,
        ROUND(business_share, 2) as business_percentage,
        ROUND(payment_success_rate, 1) as payment_success_rate,
        -- Performance score calculation (0-100)
        ROUND(
            GREATEST(0, 
                100 - 
                (overdue_rate * 2) - 
                (GREATEST(0, avg_payment_days - 150) * 0.1)
            ), 0
        ) as performance_score,
        CASE 
            WHEN ROUND(GREATEST(0, 100 - (overdue_rate * 2) - (GREATEST(0, avg_payment_days - 150) * 0.1)), 0) >= 90 THEN '🟢 Excellent'
            WHEN ROUND(GREATEST(0, 100 - (overdue_rate * 2) - (GREATEST(0, avg_payment_days - 150) * 0.1)), 0) >= 75 THEN '🟡 Good' 
            WHEN ROUND(GREATEST(0, 100 - (overdue_rate * 2) - (GREATEST(0, avg_payment_days - 150) * 0.1)), 0) >= 60 THEN '🟠 Average'
            ELSE '🔴 Needs Attention'
        END as vendor_status
    FROM vendor_metrics
    WHERE business_share > 0.5
    ORDER BY business_share DESC
    LIMIT 15;
  `,

  // Financial Insights Query
  financialInsights: `
    WITH vendor_financials AS (
        SELECT 
            b.vendor_id,
            COUNT(*) as total_bills,
            SUM(CASE 
                WHEN b.total_bcy LIKE '%K' THEN 
                    CAST(REPLACE(REPLACE(b.total_bcy, 'SAR ', ''), 'K', '') AS NUMERIC) * 1000
                ELSE 
                    CAST(REPLACE(REPLACE(b.total_bcy, 'SAR ', ''), ',', '') AS NUMERIC)
            END) as total_spend_ytd,
            AVG(CASE 
                WHEN b.total_bcy LIKE '%K' THEN 
                    CAST(REPLACE(REPLACE(b.total_bcy, 'SAR ', ''), 'K', '') AS NUMERIC) * 1000
                ELSE 
                    CAST(REPLACE(REPLACE(b.total_bcy, 'SAR ', ''), ',', '') AS NUMERIC)
            END) as avg_order_value,
            MAX(TO_DATE(b.bill_date, 'DD Mon YYYY')) as last_bill_date,
            CURRENT_DATE - MAX(TO_DATE(b.bill_date, 'DD Mon YYYY')) as days_since_last_bill,
            AVG(CASE 
                WHEN b.due_date IS NOT NULL AND b.bill_date IS NOT NULL 
                THEN TO_DATE(b.due_date, 'DD Mon YYYY') - TO_DATE(b.bill_date, 'DD Mon YYYY')
                ELSE 0 
            END) as avg_payment_terms,
            AVG(CASE 
                WHEN TO_DATE(b.bill_date, 'DD Mon YYYY') >= CURRENT_DATE - INTERVAL '90 days'
                THEN CAST(b.age_in_days AS INTEGER) 
            END) as recent_avg_payment_days,
            AVG(CASE 
                WHEN TO_DATE(b.bill_date, 'DD Mon YYYY') < CURRENT_DATE - INTERVAL '90 days'
                THEN CAST(b.age_in_days AS INTEGER) 
            END) as historical_avg_payment_days
        FROM bills b
        WHERE b.vendor_id IS NOT NULL 
            AND b.total_bcy IS NOT NULL 
            AND b.bill_date IS NOT NULL
        GROUP BY b.vendor_id
        HAVING COUNT(*) >= 10
    )
    SELECT 
        vendor_id,
        ROUND(total_spend_ytd, 0) as total_spend_ytd,
        ROUND(avg_order_value, 0) as avg_order_value,
        last_bill_date,
        days_since_last_bill,
        CASE 
            WHEN days_since_last_bill <= 7 THEN 'Very Recent'
            WHEN days_since_last_bill <= 30 THEN 'Recent' 
            WHEN days_since_last_bill <= 90 THEN 'Moderate'
            ELSE 'Inactive'
        END as activity_status,
        ROUND(avg_payment_terms, 0) as credit_terms_days,
        ROUND(recent_avg_payment_days, 1) as recent_payment_days,
        ROUND(historical_avg_payment_days, 1) as historical_payment_days,
        CASE 
            WHEN recent_avg_payment_days < historical_avg_payment_days THEN '⬇️ Improving'
            WHEN recent_avg_payment_days > historical_avg_payment_days THEN '⬆️ Deteriorating'
            ELSE '➡️ Stable'
        END as payment_trend
    FROM vendor_financials
    ORDER BY total_spend_ytd DESC
    LIMIT 15;
  `
}

/**
 * Utility function to execute raw SQL with error handling
 */
export async function executeVendorQuery<T>(query: string): Promise<T[]> {
  const { data, error } = await supabase.rpc('execute_sql', { query })
  
  if (error) {
    console.error('Vendor query error:', error)
    throw error
  }
  
  return data || []
}