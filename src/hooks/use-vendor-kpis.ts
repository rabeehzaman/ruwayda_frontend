"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
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
  VendorAPIResponse 
} from '@/types/vendor'

// Helper function to parse currency values like "SAR 3,446.21" to numbers
const parseCurrencyValue = (value: string | null | undefined): number => {
  if (!value || value === '' || value === 'null') return 0
  // Remove currency prefix and commas, then parse as float
  const cleanValue = value.toString().replace(/^SAR\s*/, '').replace(/,/g, '').trim()
  const parsed = parseFloat(cleanValue)
  return isNaN(parsed) ? 0 : parsed
}

// Helper function to parse date strings in different formats
const parseDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null

  // Handle "28 Jul 2025" format (bills.bill_date)
  if (dateStr.match(/^\d{1,2}\s\w{3}\s\d{4}$/)) {
    return new Date(dateStr)
  }

  // Handle "2024-08-05 10:40:49" format (payments_made.created_time)
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(dateStr)
  }

  // Fallback to standard Date parsing
  return new Date(dateStr)
}

// Helper function to convert location names to location IDs
const convertLocationNamesToIds = async (locationNames: string[]): Promise<string[]> => {
  if (!locationNames || locationNames.length === 0) return []

  const { data: branchData, error: branchError } = await supabase
    .from('branch')
    .select('location_id, location_name')
    .in('location_name', locationNames)

  if (branchError) {
    console.error('Error fetching branch IDs:', branchError)
    return []
  }

  return branchData?.map(b => b.location_id) || []
}


/**
 * Hook for vendor KPI cards data - Simplified for SWEETS (no payments_made table)
 */
export function useVendorKPIs(locationIds?: string[]): VendorAPIResponse<VendorKPIs> {
  const [data, setData] = useState<VendorKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchKPIs() {
      try {
        setLoading(true)
        setError(null)

        // Convert location names to location IDs if needed
        const locationIdsToFilter = await convertLocationNamesToIds(locationIds || [])

        // Get all bills with vendor info
        let query = supabase
          .from('vendor_bills_filtered')
          .select('*')

        if (locationIdsToFilter.length > 0) {
          query = query.in('location_id', locationIdsToFilter)
        }

        const { data: billsWithVendors, error: billsError } = await query

        if (billsError) throw billsError

        // Active Vendors This Month
        const currentMonth = new Date()
        const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)

        const activeVendorsThisMonth = new Set()
        billsWithVendors?.forEach(bill => {
          const billDate = parseDate(bill.bill_date)
          if (billDate && billDate >= firstDayOfMonth) {
            activeVendorsThisMonth.add(bill.vendor_id)
          }
        })

        // Calculate metrics based on bill status and balance_bcy
        let totalBillAmount = 0
        let totalOutstandingAmount = 0
        let paidBillsCount = 0
        let openCount = 0
        let overdueCount = 0
        let totalAgeDays = 0
        let ageDaysCount = 0

        billsWithVendors?.forEach(bill => {
          const billAmount = parseCurrencyValue(bill.total_bcy)
          const balanceAmount = parseCurrencyValue(bill.balance_bcy)
          totalBillAmount += billAmount
          totalOutstandingAmount += balanceAmount

          // Calculate average age for bills
          const ageDays = parseInt(bill.age_in_days || '0')
          if (ageDays > 0) {
            totalAgeDays += ageDays
            ageDaysCount++
          }

          // Count bill statuses
          if (bill.bill_status === 'Open') openCount++
          if (bill.bill_status === 'Overdue') overdueCount++
          if (bill.bill_status === 'Paid') paidBillsCount++
        })

        const totalBills = billsWithVendors?.length || 0
        const avgPaymentDays = ageDaysCount > 0 ? totalAgeDays / ageDaysCount : 0
        const overduePercentage = totalBills > 0 ? (overdueCount / totalBills) * 100 : 0
        const paymentCompletionRate = totalBillAmount > 0 ? ((totalBillAmount - totalOutstandingAmount) / totalBillAmount) * 100 : 0
        const uniqueActiveVendors = activeVendorsThisMonth.size

        const kpiData: VendorKPIs = {
          outstanding_bills: openCount + overdueCount,
          open_bills: openCount,
          overdue_bills: overdueCount,
          avg_payment_days: Math.round(avgPaymentDays * 10) / 10,
          overdue_percentage: Math.round(overduePercentage * 100) / 100,
          active_vendors_this_month: uniqueActiveVendors,
          payment_success_rate: Math.round(paymentCompletionRate * 100) / 100,
          total_bills: totalBills,
          paid_bills: paidBillsCount,
          total_outstanding_amount: Math.round(totalOutstandingAmount),
          total_billed_amount: Math.round(totalBillAmount),
          total_paid_amount: Math.round(totalBillAmount - totalOutstandingAmount)
        }

        setData(kpiData)
      } catch (err) {
        console.error('Error fetching vendor KPIs:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch vendor KPIs')
      } finally {
        setLoading(false)
      }
    }

    fetchKPIs()
  }, [locationIds])

  return { data, loading, error }
}

/**
 * Hook for vendor performance scorecard - Enhanced with payment data
 */
export function useVendorPerformanceScorecard(locationIds?: string[]): VendorAPIResponse<VendorPerformance[]> {
  const [data, setData] = useState<VendorPerformance[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPerformanceData() {
      try {
        setLoading(true)
        setError(null)

        // Convert location names to location IDs if needed
        const locationIdsToFilter = await convertLocationNamesToIds(locationIds || [])

        // Get bills with vendor data (excluding opening balance via view)
        let query = supabase
          .from('vendor_bills_filtered')
          .select('*')

        if (locationIdsToFilter.length > 0) {
          query = query.in('location_id', locationIdsToFilter)
        }

        const { data: billsData, error: billsError } = await query

        if (billsError) throw billsError

        // Get payments data
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments_made')
          .select('bill_id, amount_bcy, created_time')
          .not('bill_id', 'is', null)
        
        if (paymentsError) throw paymentsError

        // Create payment lookup map
        const paymentsByBill = new Map()
        paymentsData?.forEach(payment => {
          if (!payment.bill_id) return // Skip payments without bill_id
          
          if (!paymentsByBill.has(payment.bill_id)) {
            paymentsByBill.set(payment.bill_id, [])
          }
          
          const paymentAmount = parseCurrencyValue(payment.amount_bcy)
          const paymentDate = parseDate(payment.created_time)
          
          if (paymentAmount > 0) { // Only include payments with valid amounts
            paymentsByBill.get(payment.bill_id).push({
              amount: paymentAmount,
              date: paymentDate || new Date()
            })
          }
        })

        // Calculate performance metrics per vendor with actual payment data
        const vendorMetrics = new Map<string, {
          vendor_name: string
          total_bills: number
          total_billed_amount: number
          total_paid_amount: number
          overdue_bills: number
          bills_with_payments: number
          total_payment_days: number
          payment_reliability_score: number
          outstanding_amount: number
        }>()

        billsData?.forEach(bill => {
          if (!bill.vendor_id) return

          const vendorName = bill.vendor_name || `Vendor ${bill.vendor_id.slice(-4)}`
          const billAmount = parseCurrencyValue(bill.total_bcy)
          const billPayments = paymentsByBill.get(bill.bill_id) || []
          const totalPaidForBill = billPayments.reduce((sum, p) => sum + p.amount, 0)
          const outstandingForBill = Math.max(billAmount - totalPaidForBill, 0)

          const existing = vendorMetrics.get(bill.vendor_id) || {
            vendor_name: vendorName,
            total_bills: 0,
            total_billed_amount: 0,
            total_paid_amount: 0,
            overdue_bills: 0,
            bills_with_payments: 0,
            total_payment_days: 0,
            payment_reliability_score: 0,
            outstanding_amount: 0
          }

          existing.total_bills++
          existing.total_billed_amount += billAmount
          existing.total_paid_amount += totalPaidForBill
          existing.outstanding_amount += outstandingForBill
          
          if (bill.bill_status === 'Overdue') {
            existing.overdue_bills++
          }
          
          // Calculate actual payment days if payments exist
          if (billPayments.length > 0) {
            existing.bills_with_payments++
            const billDate = parseDate(bill.bill_date)
            const lastPaymentDate = new Date(Math.max(...billPayments.map(p => p.date.getTime())))
            const actualPaymentDays = Math.floor((lastPaymentDate.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24))
            existing.total_payment_days += actualPaymentDays
            
            // Calculate payment reliability (faster payments = higher reliability)
            const reliabilityScore = Math.max(100 - actualPaymentDays, 0)
            existing.payment_reliability_score = (existing.payment_reliability_score + reliabilityScore) / 2
          }

          vendorMetrics.set(bill.vendor_id, existing)
        })

        const totalBills = billsData?.length || 0
        const totalBilledAmount = Array.from(vendorMetrics.values()).reduce((sum, v) => sum + v.total_billed_amount, 0)

        // Convert to performance data with enhanced payment analytics
        const performanceData: VendorPerformance[] = Array.from(vendorMetrics.entries())
          .map(([vendor_id, metrics]) => {
            const avg_payment_days = metrics.bills_with_payments > 0 
              ? metrics.total_payment_days / metrics.bills_with_payments 
              : 0
            
            const overdue_percentage = metrics.total_bills > 0 
              ? (metrics.overdue_bills / metrics.total_bills) * 100 
              : 0
            
            const business_percentage = totalBilledAmount > 0 
              ? (metrics.total_billed_amount / totalBilledAmount) * 100 
              : 0
            
            // Payment completion rate based on actual payments vs billed amounts
            const payment_success_rate = metrics.total_billed_amount > 0 
              ? (metrics.total_paid_amount / metrics.total_billed_amount) * 100 
              : 0

            // Enhanced performance score with payment reliability
            const base_score = Math.max(0, 100 - (overdue_percentage * 1.5))
            const payment_speed_bonus = Math.max(0, 30 - (avg_payment_days / 5)) // Bonus for faster payments
            const payment_completion_bonus = payment_success_rate * 0.3 // Bonus for payment completion
            const reliability_bonus = metrics.payment_reliability_score * 0.2 // Bonus for reliability
            
            const performance_score = Math.min(100, 
              base_score + payment_speed_bonus + payment_completion_bonus + reliability_bonus
            )

            let vendor_status: VendorPerformance['vendor_status']
            if (performance_score >= 90) vendor_status = '🟢 Excellent'
            else if (performance_score >= 75) vendor_status = '🟡 Good'
            else if (performance_score >= 60) vendor_status = '🟠 Average'
            else vendor_status = '🔴 Needs Attention'

            return {
              vendor_id,
              vendor_name: metrics.vendor_name,
              performance_score: Math.round(performance_score),
              total_bills: metrics.total_bills,
              avg_payment_days: Math.round(avg_payment_days * 10) / 10, // Based on actual payment dates
              overdue_percentage: Math.round(overdue_percentage * 10) / 10,
              business_percentage: Math.round(business_percentage * 100) / 100, // Based on actual billed amounts
              payment_success_rate: Math.round(payment_success_rate * 10) / 10, // Based on actual payments
              vendor_status,
              payment_reliability_score: Math.round(metrics.payment_reliability_score), // NEW: Payment reliability
              outstanding_amount: Math.round(metrics.outstanding_amount) // NEW: Actual outstanding amount
            }
          })
          .filter(vendor => vendor.business_percentage > 0.5) // Only significant vendors
          .sort((a, b) => b.business_percentage - a.business_percentage)
          .slice(0, 15) // Top 15

        setData(performanceData)
      } catch (err) {
        console.error('Error fetching vendor performance:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch vendor performance data')
      } finally {
        setLoading(false)
      }
    }

    fetchPerformanceData()
  }, [locationIds])

  return { data, loading, error }
}

/**
 * Hook for vendor alerts and problem vendors - Enhanced with payment data
 */
export function useVendorAlerts(locationIds?: string[]): VendorAPIResponse<{ alerts: VendorAlert[], problemVendors: ProblemVendor[] }> {
  const [data, setData] = useState<{ alerts: VendorAlert[], problemVendors: ProblemVendor[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAlerts() {
      try {
        setLoading(true)
        setError(null)

        // Convert location names to location IDs if needed
        const locationIdsToFilter = await convertLocationNamesToIds(locationIds || [])

        // Get bills with vendor data (excluding opening balance via view)
        let query = supabase
          .from('vendor_bills_filtered')
          .select('*')

        if (locationIdsToFilter.length > 0) {
          query = query.in('location_id', locationIdsToFilter)
        }

        const { data: billsData, error: billsError } = await query

        if (billsError) throw billsError

        // Get payments data
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments_made')
          .select('bill_id, amount_bcy, created_time')
          .not('bill_id', 'is', null)
        
        if (paymentsError) throw paymentsError

        // Create payment lookup map
        const paymentsByBill = new Map()
        paymentsData?.forEach(payment => {
          if (!payment.bill_id) return // Skip payments without bill_id
          
          if (!paymentsByBill.has(payment.bill_id)) {
            paymentsByBill.set(payment.bill_id, [])
          }
          
          const paymentAmount = parseCurrencyValue(payment.amount_bcy)
          const paymentDate = parseDate(payment.created_time)
          
          if (paymentAmount > 0) { // Only include payments with valid amounts
            paymentsByBill.get(payment.bill_id).push({
              amount: paymentAmount,
              date: paymentDate || new Date()
            })
          }
        })

        // Calculate enhanced vendor metrics with payment data
        const vendorStats = new Map<string, { 
          vendor_name: string
          total_bills: number
          total_billed_amount: number
          total_paid_amount: number
          outstanding_amount: number
          overdue_bills: number
          bills_without_payments: number
          slow_payment_bills: number
          partial_payment_bills: number
        }>()
        
        const currentDate = new Date()
        const totalBilledAmount = billsData?.reduce((sum, bill) => sum + parseCurrencyValue(bill.total_bcy), 0) || 0
        
        billsData?.forEach(bill => {
          if (!bill.vendor_id) return
          
          const vendorName = bill.vendor_name || `Vendor ${bill.vendor_id.slice(-4)}`
          const billAmount = parseCurrencyValue(bill.total_bcy)
          const billPayments = paymentsByBill.get(bill.bill_id) || []
          const totalPaidForBill = billPayments.reduce((sum, p) => sum + p.amount, 0)
          const outstandingForBill = Math.max(billAmount - totalPaidForBill, 0)
          
          const existing = vendorStats.get(bill.vendor_id) || { 
            vendor_name: vendorName,
            total_bills: 0,
            total_billed_amount: 0,
            total_paid_amount: 0,
            outstanding_amount: 0,
            overdue_bills: 0,
            bills_without_payments: 0,
            slow_payment_bills: 0,
            partial_payment_bills: 0
          }
          
          existing.total_bills++
          existing.total_billed_amount += billAmount
          existing.total_paid_amount += totalPaidForBill
          existing.outstanding_amount += outstandingForBill
          
          if (bill.bill_status === 'Overdue') {
            existing.overdue_bills++
          }
          
          // Check payment status
          if (billPayments.length === 0) {
            existing.bills_without_payments++
          } else {
            // Check for slow payments (>30 days from bill date)
            const billDate = parseDate(bill.bill_date)
            const lastPaymentDate = new Date(Math.max(...billPayments.map(p => p.date.getTime())))
            const paymentDays = Math.floor((lastPaymentDate.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24))
            
            if (paymentDays > 30) {
              existing.slow_payment_bills++
            }
            
            // Check for partial payments
            if (totalPaidForBill < billAmount * 0.95) { // Less than 95% paid
              existing.partial_payment_bills++
            }
          }
          
          vendorStats.set(bill.vendor_id, existing)
        })

        // Count various risk categories
        let highRiskVendors = 0
        let concentrationRiskVendors = 0
        let slowPaymentVendors = 0
        let partialPaymentVendors = 0
        const totalBills = billsData?.length || 0

        const problemVendors: ProblemVendor[] = []

        vendorStats.forEach((stats, vendor_id) => {
          const overdueRate = stats.total_bills > 0 ? (stats.overdue_bills / stats.total_bills) * 100 : 0
          const businessShare = totalBilledAmount > 0 ? (stats.total_billed_amount / totalBilledAmount) * 100 : 0
          const paymentCompletionRate = stats.total_billed_amount > 0 ? (stats.total_paid_amount / stats.total_billed_amount) * 100 : 0
          const slowPaymentRate = stats.total_bills > 0 ? (stats.slow_payment_bills / stats.total_bills) * 100 : 0
          const partialPaymentRate = stats.total_bills > 0 ? (stats.partial_payment_bills / stats.total_bills) * 100 : 0

          // Count risk categories
          if (overdueRate > 30 || paymentCompletionRate < 70) {
            highRiskVendors++
          }
          if (businessShare > 10) {
            concentrationRiskVendors++
          }
          if (slowPaymentRate > 40) {
            slowPaymentVendors++
          }
          if (partialPaymentRate > 30) {
            partialPaymentVendors++
          }

          // Add to problem vendors based on enhanced criteria
          const hasSignificantIssues = (
            overdueRate > 15 || 
            businessShare > 10 || 
            paymentCompletionRate < 80 ||
            slowPaymentRate > 30 ||
            partialPaymentRate > 25
          ) && stats.total_bills >= 5

          if (hasSignificantIssues) {
            let risk_level: string
            let recommended_action: string

            if (overdueRate > 40 || paymentCompletionRate < 50) {
              risk_level = 'CRITICAL - Payment Crisis'
              recommended_action = 'Immediate collection action and payment plan negotiation'
            } else if (overdueRate > 25 || paymentCompletionRate < 70) {
              risk_level = 'HIGH - Payment Issues'
              recommended_action = 'Urgent payment follow-up and terms review'
            } else if (businessShare > 15) {
              risk_level = 'HIGH - Concentration Risk'
              recommended_action = 'Diversify supplier base to reduce dependency'
            } else if (slowPaymentRate > 50) {
              risk_level = 'HIGH - Slow Payment Pattern'
              recommended_action = 'Negotiate payment acceleration incentives'
            } else if (partialPaymentRate > 40) {
              risk_level = 'MEDIUM - Partial Payment Issues'
              recommended_action = 'Review invoicing and payment reconciliation process'
            } else if (overdueRate > 15) {
              risk_level = 'MEDIUM - Monitor Closely'
              recommended_action = 'Enhanced payment monitoring and follow-up'
            } else {
              risk_level = 'LOW - Standard Monitoring'
              recommended_action = 'Continue standard payment process'
            }

            problemVendors.push({
              vendor_id,
              vendor_name: stats.vendor_name,
              risk_level,
              overdue_percentage: Math.round(overdueRate * 10) / 10,
              total_bills: stats.total_bills,
              recommended_action,
              outstanding_amount: Math.round(stats.outstanding_amount), // NEW: Actual outstanding amount
              payment_completion_rate: Math.round(paymentCompletionRate * 10) / 10 // NEW: Payment completion rate
            })
          }
        })

        // Calculate active vendors this month
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const monthString = firstDayOfMonth.toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        })

        const activeVendorsThisMonth = new Set()
        billsData?.forEach(bill => {
          if (bill.bill_date >= monthString) {
            activeVendorsThisMonth.add(bill.vendor_id)
          }
        })

        const uniqueActiveVendors = activeVendorsThisMonth.size
        const totalOutstandingAmount = Array.from(vendorStats.values()).reduce((sum, v) => sum + v.outstanding_amount, 0)

        // Create enhanced alerts based on payment data
        const alerts: VendorAlert[] = [
          {
            alert_level: 'URGENT',
            icon: '🔴',
            alert_message: `${highRiskVendors} vendors with critical payment issues (>30% overdue or <70% payment completion)`,
            category: 'Critical Payment Risk'
          },
          {
            alert_level: 'WARNING',
            icon: '🟠',
            alert_message: `${concentrationRiskVendors} vendors represent >10% of total spend`,
            category: 'Concentration Risk'
          },
          {
            alert_level: 'WARNING',
            icon: '🟡',
            alert_message: `${slowPaymentVendors} vendors showing slow payment patterns (>40% of bills paid slowly)`,
            category: 'Payment Efficiency'
          },
          {
            alert_level: 'INFO',
            icon: '💰',
            alert_message: `SAR ${Math.round(totalOutstandingAmount).toLocaleString()} in actual outstanding amounts`,
            category: 'Outstanding Balance'
          },
          {
            alert_level: 'INFO',
            icon: '🔵',
            alert_message: `${uniqueActiveVendors} vendors active this month`,
            category: 'Activity Summary'
          }
        ]

        // Sort problem vendors by priority and impact
        problemVendors.sort((a, b) => {
          // First sort by risk level
          if (a.risk_level.includes('CRITICAL') && !b.risk_level.includes('CRITICAL')) return -1
          if (!a.risk_level.includes('CRITICAL') && b.risk_level.includes('CRITICAL')) return 1
          if (a.risk_level.includes('HIGH') && !b.risk_level.includes('HIGH')) return -1
          if (!a.risk_level.includes('HIGH') && b.risk_level.includes('HIGH')) return 1
          
          // Then sort by outstanding amount (higher impact first)
          if (a.outstanding_amount && b.outstanding_amount) {
            return b.outstanding_amount - a.outstanding_amount
          }
          
          // Finally sort by overdue percentage
          return b.overdue_percentage - a.overdue_percentage
        })

        setData({ alerts, problemVendors: problemVendors.slice(0, 10) })
      } catch (err) {
        console.error('Error fetching vendor alerts:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch vendor alerts')
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
  }, [locationIds])

  return { data, loading, error }
}

/**
 * Hook for vendor financial insights - Enhanced with actual cash flow data
 */
export function useVendorFinancialInsights(locationIds?: string[]): VendorAPIResponse<VendorFinancialInsight[]> {
  const [data, setData] = useState<VendorFinancialInsight[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFinancialInsights() {
      try {
        setLoading(true)
        setError(null)

        // Get bills with vendor data, filtering out opening balance
        let query = supabase
          .from('vendor_bills_filtered')
          .select('*')

        if (locationIds && locationIds.length > 0) {
          query = query.in('location_name', locationIds)
        }

        const { data: billsData, error: billsError } = await query

        if (billsError) throw billsError

        // Get payments data
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments_made')
          .select('bill_id, amount_bcy, created_time')
          .not('bill_id', 'is', null)
        
        if (paymentsError) throw paymentsError

        // Create payment lookup map
        const paymentsByBill = new Map()
        paymentsData?.forEach(payment => {
          if (!payment.bill_id) return // Skip payments without bill_id
          
          if (!paymentsByBill.has(payment.bill_id)) {
            paymentsByBill.set(payment.bill_id, [])
          }
          
          const paymentAmount = parseCurrencyValue(payment.amount_bcy)
          const paymentDate = parseDate(payment.created_time)
          
          if (paymentAmount > 0) { // Only include payments with valid amounts
            paymentsByBill.get(payment.bill_id).push({
              amount: paymentAmount,
              date: paymentDate || new Date()
            })
          }
        })

        // Calculate enhanced financial metrics with actual payment data
        const vendorFinancials = new Map<string, {
          vendor_name: string
          total_billed_amount: number
          total_paid_amount: number
          outstanding_amount: number
          bills_with_payments: number
          bills: Array<{ 
            bill_date: string
            billed_amount: number
            paid_amount: number
            payment_dates: Date[]
            actual_payment_days: number
          }>
          bill_count: number
          recent_payments: Array<{ amount: number, date: Date }>
          cash_flow_data: Array<{ month: string, billed: number, paid: number }>
        }>()

        // Process bills with payment integration
        billsData?.forEach(bill => {
          if (!bill.vendor_id || !bill.total_bcy) return

          const vendorName = bill.vendor_name || `Vendor ${bill.vendor_id.slice(-4)}`
          const billedAmount = parseCurrencyValue(bill.total_bcy)
          const billPayments = paymentsByBill.get(bill.bill_id) || []
          const totalPaidForBill = billPayments.reduce((sum, p) => sum + p.amount, 0)
          const outstandingForBill = Math.max(billedAmount - totalPaidForBill, 0)
          
          // Calculate actual payment days
          let actualPaymentDays = 0
          if (billPayments.length > 0) {
            const billDate = parseDate(bill.bill_date)
            const firstPaymentDate = new Date(Math.min(...billPayments.map(p => p.date.getTime())))
            actualPaymentDays = Math.floor((firstPaymentDate.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24))
          }

          const existing = vendorFinancials.get(bill.vendor_id) || {
            vendor_name: vendorName,
            total_billed_amount: 0,
            total_paid_amount: 0,
            outstanding_amount: 0,
            bills_with_payments: 0,
            bills: [] as Array<{ 
              bill_date: string
              billed_amount: number
              paid_amount: number
              payment_dates: Date[]
              actual_payment_days: number
            }>,
            bill_count: 0,
            recent_payments: [] as Array<{ amount: number, date: Date }>,
            cash_flow_data: [] as Array<{ month: string, billed: number, paid: number }>
          }

          existing.total_billed_amount += billedAmount
          existing.total_paid_amount += totalPaidForBill
          existing.outstanding_amount += outstandingForBill
          existing.bill_count++
          
          if (billPayments.length > 0) {
            existing.bills_with_payments++
            // Add recent payments (last 90 days)
            const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
            billPayments.forEach(payment => {
              if (payment.date >= ninetyDaysAgo) {
                existing.recent_payments.push(payment)
              }
            })
          }

          existing.bills.push({
            bill_date: bill.bill_date,
            billed_amount: billedAmount,
            paid_amount: totalPaidForBill,
            payment_dates: billPayments.map(p => p.date),
            actual_payment_days: actualPaymentDays
          })

          vendorFinancials.set(bill.vendor_id, existing)
        })

        // Convert to enhanced financial insights with actual cash flow data
        const currentDate = new Date()

        const financialInsights: VendorFinancialInsight[] = Array.from(vendorFinancials.entries())
          .map(([vendor_id, metrics]) => {
            // Calculate average order value based on actual billed amounts
            const avg_order_value = metrics.bill_count > 0 
              ? metrics.total_billed_amount / metrics.bill_count 
              : 0

            // Find most recent bill and payment
            const sortedBills = metrics.bills.sort((a, b) => 
              new Date(b.bill_date).getTime() - new Date(a.bill_date).getTime()
            )
            const lastBill = sortedBills[0]
            const last_bill_date = lastBill ? lastBill.bill_date : ''
            
            // Find most recent payment
            const sortedPayments = metrics.recent_payments.sort((a, b) => b.date.getTime() - a.date.getTime())
            const lastPayment = sortedPayments[0]
            const last_payment_date = lastPayment ? lastPayment.date.toISOString().split('T')[0] : ''
            
            // Calculate days since last bill and payment
            const days_since_last_bill = lastBill 
              ? Math.floor((currentDate.getTime() - new Date(lastBill.bill_date).getTime()) / (1000 * 60 * 60 * 24))
              : 999
              
            const days_since_last_payment = lastPayment 
              ? Math.floor((currentDate.getTime() - lastPayment.date.getTime()) / (1000 * 60 * 60 * 24))
              : 999

            // Determine activity status based on both bills and payments
            let activity_status: VendorFinancialInsight['activity_status']
            const mostRecentActivity = Math.min(days_since_last_bill, days_since_last_payment)
            if (mostRecentActivity <= 7) activity_status = 'Very Recent'
            else if (mostRecentActivity <= 30) activity_status = 'Recent'
            else if (mostRecentActivity <= 90) activity_status = 'Moderate'
            else activity_status = 'Inactive'

            // Calculate payment trends based on ACTUAL payment days
            const billsWithPayments = sortedBills.filter(b => b.payment_dates.length > 0)
            const recentPaidBills = billsWithPayments.slice(0, Math.min(5, billsWithPayments.length))
            const historicalPaidBills = billsWithPayments.slice(5)

            const recent_payment_days = recentPaidBills.length > 0
              ? recentPaidBills.reduce((sum, b) => sum + b.actual_payment_days, 0) / recentPaidBills.length
              : 0

            const historical_payment_days = historicalPaidBills.length > 0
              ? historicalPaidBills.reduce((sum, b) => sum + b.actual_payment_days, 0) / historicalPaidBills.length
              : recent_payment_days

            // Determine payment trend based on actual payment behavior
            let payment_trend: VendorFinancialInsight['payment_trend']
            const trendDiff = recent_payment_days - historical_payment_days
            if (trendDiff < -5) payment_trend = '⬇️ Improving'
            else if (trendDiff > 5) payment_trend = '⬆️ Deteriorating'
            else payment_trend = '➡️ Stable'

            // Calculate payment completion rate
            const payment_completion_rate = metrics.total_billed_amount > 0 
              ? (metrics.total_paid_amount / metrics.total_billed_amount) * 100 
              : 0

            // Calculate cash conversion velocity
            const cash_conversion_days = metrics.bills_with_payments > 0
              ? billsWithPayments.reduce((sum, b) => sum + b.actual_payment_days, 0) / metrics.bills_with_payments
              : 0

            return {
              vendor_id,
              vendor_name: metrics.vendor_name,
              total_spend_ytd: Math.round(metrics.total_billed_amount), // Based on actual billed amounts
              total_paid_ytd: Math.round(metrics.total_paid_amount), // NEW: Actual cash outflow
              outstanding_amount: Math.round(metrics.outstanding_amount), // NEW: Actual outstanding
              avg_order_value: Math.round(avg_order_value),
              last_bill_date,
              last_payment_date: last_payment_date, // NEW: Last payment date
              days_since_last_bill,
              days_since_last_payment: days_since_last_payment, // NEW: Days since last payment
              activity_status,
              credit_terms_days: 30, // Default assumption
              recent_payment_days: Math.round(recent_payment_days), // Based on actual payments
              historical_payment_days: Math.round(historical_payment_days), // Based on actual payments
              payment_trend,
              payment_completion_rate: Math.round(payment_completion_rate * 10) / 10, // NEW: Payment completion rate
              cash_conversion_days: Math.round(cash_conversion_days), // NEW: Actual cash conversion timing
              payment_velocity: metrics.recent_payments.length, // NEW: Recent payment frequency
              bills_with_payments: metrics.bills_with_payments // NEW: Bills that actually have payments
            }
          })
          .filter(vendor => vendor.total_spend_ytd > 1000) // Only significant vendors
          .sort((a, b) => b.total_spend_ytd - a.total_spend_ytd)
          .slice(0, 20) // Top 20 by spend

        setData(financialInsights)
      } catch (err) {
        console.error('Error fetching vendor financial insights:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch financial insights')
      } finally {
        setLoading(false)
      }
    }

    fetchFinancialInsights()
  }, [locationIds])

  return { data, loading, error }
}

/**
 * Hook for vendor payment trends - Enhanced with ACTUAL payment data
 */
export function useVendorPaymentTrends(locationIds?: string[]): VendorAPIResponse<{ 
  overallTrends: OverallPaymentTrend[], 
  topVendorTrends: VendorPaymentTrend[],
  cashFlowTrends: Array<{
    month_key: string
    total_billed: number
    total_paid: number
    payment_velocity: number
  }>
}> {
  const [data, setData] = useState<{ 
    overallTrends: OverallPaymentTrend[], 
    topVendorTrends: VendorPaymentTrend[],
    cashFlowTrends: Array<{
      month_key: string
      total_billed: number
      total_paid: number
      payment_velocity: number
    }>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPaymentTrends() {
      try {
        setLoading(true)
        setError(null)

        // Convert location names to location IDs if needed
        const locationIdsToFilter = await convertLocationNamesToIds(locationIds || [])

        // Get bills with vendor data, filtering out opening balance
        let query = supabase
          .from('vendor_bills_filtered')
          .select('*')
          .not('bill_date', 'is', null)

        if (locationIdsToFilter.length > 0) {
          query = query.in('location_id', locationIdsToFilter)
        }

        const { data: billsData, error: billsError } = await query

        if (billsError) throw billsError

        // Get payments data
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments_made')
          .select('bill_id, amount_bcy, created_time')
          .not('bill_id', 'is', null)
        
        if (paymentsError) throw paymentsError

        // Create payment lookup map
        const paymentsByBill = new Map()
        paymentsData?.forEach(payment => {
          if (!payment.bill_id) return // Skip payments without bill_id
          
          if (!paymentsByBill.has(payment.bill_id)) {
            paymentsByBill.set(payment.bill_id, [])
          }
          
          const paymentAmount = parseCurrencyValue(payment.amount_bcy)
          const paymentDate = parseDate(payment.created_time)
          
          if (paymentAmount > 0) { // Only include payments with valid amounts
            paymentsByBill.get(payment.bill_id).push({
              amount: paymentAmount,
              date: paymentDate || new Date()
            })
          }
        })

        // Process bills and payments into monthly data with ACTUAL payment analytics
        const monthlyData = new Map<string, {
          total_bills: number
          total_billed_amount: number
          total_paid_amount: number
          overdue_bills: number
          bills_with_payments: number
          actual_payment_days_sum: number
          payment_velocity: number
          vendors: Map<string, {
            vendor_name: string
            bills: number
            billed_amount: number
            paid_amount: number
            actual_payment_days_sum: number
            payment_bills_count: number
          }>
        }>()

        // Group payments by month as well
        const paymentsByMonth = new Map<string, Array<{ amount: number, date: Date }>>()
        paymentsData?.forEach(payment => {
          const paymentDate = parseDate(payment.created_time)
          const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`
          
          if (!paymentsByMonth.has(monthKey)) {
            paymentsByMonth.set(monthKey, [])
          }
          paymentsByMonth.get(monthKey)!.push({
            amount: parseCurrencyValue(payment.amount_bcy),
            date: paymentDate
          })
        })

        billsData?.forEach(bill => {
          const billDate = parseDate(bill.bill_date)
          const monthKey = `${billDate.getFullYear()}-${String(billDate.getMonth() + 1).padStart(2, '0')}`
          const vendorName = bill.vendor_name || `Vendor ${bill.vendor_id.slice(-4)}`
          const billedAmount = parseCurrencyValue(bill.total_bcy)
          const billPayments = paymentsByBill.get(bill.bill_id) || []
          const totalPaidForBill = billPayments.reduce((sum, p) => sum + p.amount, 0)
          
          const existing = monthlyData.get(monthKey) || {
            total_bills: 0,
            total_billed_amount: 0,
            total_paid_amount: 0,
            overdue_bills: 0,
            bills_with_payments: 0,
            actual_payment_days_sum: 0,
            payment_velocity: 0,
            vendors: new Map()
          }

          existing.total_bills++
          existing.total_billed_amount += billedAmount
          existing.total_paid_amount += totalPaidForBill
          
          if (bill.bill_status === 'Overdue') {
            existing.overdue_bills++
          }
          
          // Calculate ACTUAL payment days if payments exist
          if (billPayments.length > 0) {
            existing.bills_with_payments++
            const firstPaymentDate = new Date(Math.min(...billPayments.map(p => p.date.getTime())))
            const actualPaymentDays = Math.floor((firstPaymentDate.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24))
            existing.actual_payment_days_sum += actualPaymentDays
          }

          // Track vendor-specific data
          if (bill.vendor_id) {
            const vendorData = existing.vendors.get(bill.vendor_id) || {
              vendor_name: vendorName,
              bills: 0,
              billed_amount: 0,
              paid_amount: 0,
              actual_payment_days_sum: 0,
              payment_bills_count: 0
            }

            vendorData.bills++
            vendorData.billed_amount += billedAmount
            vendorData.paid_amount += totalPaidForBill
            
            if (billPayments.length > 0) {
              const firstPaymentDate = new Date(Math.min(...billPayments.map(p => p.date.getTime())))
              const actualPaymentDays = Math.floor((firstPaymentDate.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24))
              vendorData.actual_payment_days_sum += actualPaymentDays
              vendorData.payment_bills_count++
            }

            existing.vendors.set(bill.vendor_id, vendorData)
          }

          monthlyData.set(monthKey, existing)
        })

        // Calculate payment velocity for each month
        monthlyData.forEach((data, monthKey) => {
          data.payment_velocity = data.bills_with_payments > 0 
            ? data.actual_payment_days_sum / data.bills_with_payments 
            : 0
        })

        // Convert to enhanced overall trends with actual payment data
        const overallTrends: OverallPaymentTrend[] = Array.from(monthlyData.entries())
          .map(([monthKey, data]) => {
            const [year, month] = monthKey.split('-')
            const avg_payment_days = data.bills_with_payments > 0 
              ? data.actual_payment_days_sum / data.bills_with_payments 
              : 0
            const overdue_rate = data.total_bills > 0 
              ? (data.overdue_bills / data.total_bills) * 100 
              : 0
            const payment_completion_rate = data.total_billed_amount > 0
              ? (data.total_paid_amount / data.total_billed_amount) * 100
              : 0

            return {
              year,
              month,
              month_key: monthKey,
              avg_payment_days: Math.round(avg_payment_days * 10) / 10, // Based on ACTUAL payment dates
              total_bills: data.total_bills,
              overdue_bills: data.overdue_bills,
              overdue_rate: Math.round(overdue_rate * 10) / 10,
              total_billed_amount: Math.round(data.total_billed_amount), // NEW: Total billed
              total_paid_amount: Math.round(data.total_paid_amount), // NEW: Total actually paid
              payment_completion_rate: Math.round(payment_completion_rate * 10) / 10, // NEW: Payment completion rate
              bills_with_payments: data.bills_with_payments // NEW: Bills that actually have payments
            }
          })
          .sort((a, b) => a.month_key.localeCompare(b.month_key))
          .slice(-12) // Last 12 months

        // Create cash flow trends
        const cashFlowTrends = overallTrends.map(trend => ({
          month_key: trend.month_key,
          total_billed: trend.total_billed_amount || 0,
          total_paid: trend.total_paid_amount || 0,
          payment_velocity: trend.avg_payment_days
        }))

        // Get top 5 vendors by total billed amount for trend analysis
        const vendorTotals = new Map<string, { 
          vendor_name: string, 
          total_billed_amount: number,
          total_paid_amount: number,
          monthly_data: Map<string, { 
            bills: number
            billed_amount: number
            paid_amount: number
            avg_payment_days: number 
          }> 
        }>()

        monthlyData.forEach((monthData, monthKey) => {
          monthData.vendors.forEach((vendorData, vendorId) => {
            const existing = vendorTotals.get(vendorId) || {
              vendor_name: vendorData.vendor_name,
              total_billed_amount: 0,
              total_paid_amount: 0,
              monthly_data: new Map()
            }

            existing.total_billed_amount += vendorData.billed_amount
            existing.total_paid_amount += vendorData.paid_amount
            
            const avg_payment_days = vendorData.payment_bills_count > 0 
              ? vendorData.actual_payment_days_sum / vendorData.payment_bills_count 
              : 0

            existing.monthly_data.set(monthKey, {
              bills: vendorData.bills,
              billed_amount: vendorData.billed_amount,
              paid_amount: vendorData.paid_amount,
              avg_payment_days: Math.round(avg_payment_days * 10) / 10
            })

            vendorTotals.set(vendorId, existing)
          })
        })

        // Convert to vendor trends for top 5 vendors by spend
        const topVendors = Array.from(vendorTotals.entries())
          .sort(([,a], [,b]) => b.total_billed_amount - a.total_billed_amount)
          .slice(0, 5)

        const topVendorTrends: VendorPaymentTrend[] = []
        
        topVendors.forEach(([vendorId, vendorData]) => {
          overallTrends.forEach(trend => {
            const vendorMonthData = vendorData.monthly_data.get(trend.month_key)
            if (vendorMonthData && vendorMonthData.bills > 0) {
              topVendorTrends.push({
                vendor_id: vendorId,
                vendor_name: vendorData.vendor_name, // NEW: Include vendor name
                year: trend.year,
                month: trend.month,
                month_key: trend.month_key,
                avg_payment_days: vendorMonthData.avg_payment_days, // Based on ACTUAL payments
                bill_count: vendorMonthData.bills,
                billed_amount: Math.round(vendorMonthData.billed_amount), // NEW: Billed amount
                paid_amount: Math.round(vendorMonthData.paid_amount), // NEW: Paid amount
                payment_completion_rate: vendorMonthData.billed_amount > 0 // NEW: Payment completion rate
                  ? Math.round((vendorMonthData.paid_amount / vendorMonthData.billed_amount) * 100 * 10) / 10
                  : 0
              })
            }
          })
        })

        setData({ overallTrends, topVendorTrends, cashFlowTrends })
      } catch (err) {
        console.error('Error fetching payment trends:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch payment trends')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentTrends()
  }, [locationIds])

  return { data, loading, error }
}

/**
 * Hook for vendor concentration analysis
 */
export function useVendorConcentration(locationIds?: string[]): VendorAPIResponse<{ 
  concentrationData: VendorConcentration[], 
  concentrationMetrics: ConcentrationMetric[] 
}> {
  const [data, setData] = useState<{ 
    concentrationData: VendorConcentration[], 
    concentrationMetrics: ConcentrationMetric[] 
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchConcentrationData() {
      try {
        setLoading(true)
        setError(null)

        // Convert location names to location IDs if needed
        const locationIdsToFilter = await convertLocationNamesToIds(locationIds || [])

        // Get bills with amounts for concentration analysis
        let query = supabase
          .from('vendor_bills_filtered')
          .select('*')

        if (locationIdsToFilter.length > 0) {
          query = query.in('location_id', locationIdsToFilter)
        }

        const { data: billsData, error: billsError } = await query

        if (billsError) throw billsError

        // Get payments data
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments_made')
          .select('bill_id, amount_bcy, created_time')
          .not('bill_id', 'is', null)
        
        if (paymentsError) throw paymentsError

        // Create payment lookup map
        const paymentsByBill = new Map()
        paymentsData?.forEach(payment => {
          if (!payment.bill_id) return
          
          if (!paymentsByBill.has(payment.bill_id)) {
            paymentsByBill.set(payment.bill_id, [])
          }
          
          const paymentAmount = parseCurrencyValue(payment.amount_bcy)
          const paymentDate = parseDate(payment.created_time)
          
          if (paymentAmount > 0) {
            paymentsByBill.get(payment.bill_id).push({
              amount: paymentAmount,
              date: paymentDate || new Date()
            })
          }
        })

        // Calculate vendor spending with payment data
        const vendorSpending = new Map<string, { 
          vendor_name: string, 
          total_spend: number, 
          total_paid: number,
          bill_count: number 
        }>()

        let totalSpend = 0
        let totalPaid = 0

        billsData?.forEach(bill => {
          if (!bill.vendor_id || !bill.total_bcy) return

          const billAmount = parseCurrencyValue(bill.total_bcy)
          const billPayments = paymentsByBill.get(bill.bill_id) || []
          const totalPaidForBill = billPayments.reduce((sum: number, p) => sum + p.amount, 0)
          
          totalSpend += billAmount
          totalPaid += totalPaidForBill

          const existing = vendorSpending.get(bill.vendor_id) || {
            vendor_name: bill.vendor_name || `Vendor ${bill.vendor_id.slice(-4)}`,
            total_spend: 0,
            total_paid: 0,
            bill_count: 0
          }

          existing.total_spend += billAmount
          existing.total_paid += totalPaidForBill
          existing.bill_count++

          vendorSpending.set(bill.vendor_id, existing)
        })

        // Sort vendors by spending and create concentration data
        const sortedVendors = Array.from(vendorSpending.entries())
          .sort(([,a], [,b]) => b.total_spend - a.total_spend)

        const colors = [
          '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
          '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
        ]

        const concentrationData: VendorConcentration[] = []
        let otherSpend = 0
        const topVendorCount = 10

        sortedVendors.forEach(([, data], index) => {

          if (index < topVendorCount) {
            const businessPercentage = totalSpend > 0 ? (data.total_spend / totalSpend) * 100 : 0

            concentrationData.push({
              vendor_label: data.vendor_name.length > 20 
                ? data.vendor_name.substring(0, 20) + '...' 
                : data.vendor_name,
              business_percentage: Math.round(businessPercentage * 100) / 100,
              total_spend: Math.round(data.total_spend),
              total_paid: Math.round(data.total_paid),
              payment_completion_rate: data.total_spend > 0 ? Math.round((data.total_paid / data.total_spend) * 100 * 100) / 100 : 0,
              vendor_count: 1,
              chart_color: colors[index % colors.length]
            })
          } else {
            otherSpend += data.total_spend
          }
        })

        // Add "Others" category if there are more vendors
        if (sortedVendors.length > topVendorCount && otherSpend > 0) {
          const otherPercentage = totalSpend > 0 ? (otherSpend / totalSpend) * 100 : 0
          let otherPaid = 0
          
          // Calculate total paid for "others" category
          sortedVendors.slice(topVendorCount).forEach(([, data]) => {
            otherPaid += data.total_paid
          })
          
          concentrationData.push({
            vendor_label: `Others (${sortedVendors.length - topVendorCount} vendors)`,
            business_percentage: Math.round(otherPercentage * 100) / 100,
            total_spend: Math.round(otherSpend),
            total_paid: Math.round(otherPaid),
            payment_completion_rate: otherSpend > 0 ? Math.round((otherPaid / otherSpend) * 100 * 100) / 100 : 0,
            vendor_count: sortedVendors.length - topVendorCount,
            chart_color: '#6b7280'
          })
        }

        // Calculate concentration metrics
        const concentrationMetrics: ConcentrationMetric[] = []

        // Top 1 vendor concentration
        const top1Percentage = sortedVendors.length > 0 
          ? (sortedVendors[0][1].total_spend / totalSpend) * 100 
          : 0

        // Top 3 vendor concentration
        const top3Spend = sortedVendors.slice(0, 3).reduce((sum, [,data]) => sum + data.total_spend, 0)
        const top3Percentage = totalSpend > 0 ? (top3Spend / totalSpend) * 100 : 0

        // Top 5 vendor concentration
        const top5Spend = sortedVendors.slice(0, 5).reduce((sum, [,data]) => sum + data.total_spend, 0)
        const top5Percentage = totalSpend > 0 ? (top5Spend / totalSpend) * 100 : 0

        // Top 10 vendor concentration
        const top10Spend = sortedVendors.slice(0, 10).reduce((sum, [,data]) => sum + data.total_spend, 0)
        const top10Percentage = totalSpend > 0 ? (top10Spend / totalSpend) * 100 : 0

        concentrationMetrics.push(
          { metric: 'Top 1 Vendor', percentage: Math.round(top1Percentage * 10) / 10 },
          { metric: 'Top 3 Vendors', percentage: Math.round(top3Percentage * 10) / 10 },
          { metric: 'Top 5 Vendors', percentage: Math.round(top5Percentage * 10) / 10 },
          { metric: 'Top 10 Vendors', percentage: Math.round(top10Percentage * 10) / 10 }
        )

        setData({ concentrationData, concentrationMetrics })
      } catch (err) {
        console.error('Error fetching vendor concentration:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch concentration data')
      } finally {
        setLoading(false)
      }
    }

    fetchConcentrationData()
  }, [locationIds])

  return { data, loading, error }
}

/**
 * Hook for vendor relationship matrix
 */
export function useVendorRelationshipMatrix(locationIds?: string[]): VendorAPIResponse<{ 
  matrixData: Array<{
    vendor_id: string
    vendor_name: string
    relationship_strength: number
    dependency_risk: number
    total_spend: number
    total_paid: number
    payment_completion_rate: number
    interaction_frequency: number
  }>
}> {
  const [data, setData] = useState<{ 
    matrixData: Array<{
      vendor_id: string
      vendor_name: string
      relationship_strength: number
      dependency_risk: number
      total_spend: number
      total_paid: number
      payment_completion_rate: number
      interaction_frequency: number
    }>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRelationshipMatrix() {
      try {
        setLoading(true)
        setError(null)

        // Convert location names to location IDs if needed
        const locationIdsToFilter = await convertLocationNamesToIds(locationIds || [])

        // Get bills with vendor and timing data
        let query = supabase
          .from('vendor_bills_filtered')
          .select('*')

        if (locationIdsToFilter.length > 0) {
          query = query.in('location_id', locationIdsToFilter)
        }

        const { data: billsData, error: billsError } = await query

        if (billsError) throw billsError

        // Get payments data
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments_made')
          .select('bill_id, amount_bcy, created_time')
          .not('bill_id', 'is', null)
        
        if (paymentsError) throw paymentsError

        // Create payment lookup map
        const paymentsByBill = new Map()
        paymentsData?.forEach(payment => {
          if (!payment.bill_id) return
          
          if (!paymentsByBill.has(payment.bill_id)) {
            paymentsByBill.set(payment.bill_id, [])
          }
          
          const paymentAmount = parseCurrencyValue(payment.amount_bcy)
          const paymentDate = parseDate(payment.created_time)
          
          if (paymentAmount > 0) {
            paymentsByBill.get(payment.bill_id).push({
              amount: paymentAmount,
              date: paymentDate || new Date()
            })
          }
        })

        // Calculate relationship metrics per vendor
        const vendorRelationships = new Map<string, {
          vendor_name: string
          total_spend: number
          total_paid: number
          bill_count: number
          recent_bills: number
          avg_payment_days: number
          payment_consistency: number
          last_interaction_days: number
        }>()

        const currentDate = new Date()
        const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000)

        billsData?.forEach(bill => {
          if (!bill.vendor_id) return

          const existing = vendorRelationships.get(bill.vendor_id) || {
            vendor_name: bill.vendor_name || `Vendor ${bill.vendor_id.slice(-4)}`,
            total_spend: 0,
            total_paid: 0,
            bill_count: 0,
            recent_bills: 0,
            avg_payment_days: 0,
            payment_consistency: 0,
            last_interaction_days: 999
          }

          const billDate = parseDate(bill.bill_date)
          const daysSinceInteraction = Math.floor((currentDate.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24))
          
          const billAmount = parseCurrencyValue(bill.total_bcy)
          const billPayments = paymentsByBill.get(bill.bill_id) || []
          const totalPaidForBill = billPayments.reduce((sum: number, p) => sum + p.amount, 0)

          existing.bill_count++
          existing.total_spend += billAmount
          existing.total_paid += totalPaidForBill
          
          if (billDate >= thirtyDaysAgo) {
            existing.recent_bills++
          }

          if (daysSinceInteraction < existing.last_interaction_days) {
            existing.last_interaction_days = daysSinceInteraction
          }

          // Track payment timing for consistency
          const ageDays = parseInt(bill.age_in_days || '0')
          if (ageDays > 0) {
            existing.avg_payment_days = (existing.avg_payment_days + ageDays) / 2
          }

          vendorRelationships.set(bill.vendor_id, existing)
        })

        // Calculate total spend for percentage calculations
        const totalSpend = Array.from(vendorRelationships.values())
          .reduce((sum, v) => sum + v.total_spend, 0)

        // Convert to matrix data with calculated metrics
        const matrixData = Array.from(vendorRelationships.entries())
          .map(([vendor_id, metrics]) => {
            // Relationship Strength (0-100)
            // Based on: frequency of interactions, spend consistency, payment reliability
            const interactionScore = Math.min((metrics.bill_count / 12) * 30, 30) // Max 30 points for 12+ bills/year
            const recencyScore = Math.max(30 - (metrics.last_interaction_days / 10), 0) // Max 30 points, decreases with age
            const consistencyScore = Math.min((metrics.recent_bills / 3) * 20, 20) // Max 20 points for 3+ recent bills
            const paymentScore = Math.max(20 - (metrics.avg_payment_days / 10), 0) // Max 20 points, decreases with late payments

            const relationship_strength = Math.min(
              interactionScore + recencyScore + consistencyScore + paymentScore, 
              100
            )

            // Dependency Risk (0-30+)
            // Based on: spend concentration, interaction frequency, business criticality
            const spendConcentration = (metrics.total_spend / totalSpend) * 100
            const interactionDependency = Math.min(metrics.bill_count / 2, 10) // Higher frequency = higher dependency
            const recentDependency = Math.min(metrics.recent_bills * 2, 10) // Recent activity increases dependency

            const dependency_risk = spendConcentration + (interactionDependency / 10) + (recentDependency / 10)

            // Interaction frequency (bills per month)
            const interaction_frequency = Math.round((metrics.bill_count / 12) * 10) / 10

            return {
              vendor_id,
              vendor_name: metrics.vendor_name,
              relationship_strength: Math.round(relationship_strength),
              dependency_risk: Math.round(dependency_risk * 10) / 10,
              total_spend: Math.round(metrics.total_spend),
              total_paid: Math.round(metrics.total_paid),
              payment_completion_rate: metrics.total_spend > 0 ? Math.round((metrics.total_paid / metrics.total_spend) * 100 * 100) / 100 : 0,
              interaction_frequency
            }
          })
          .filter(vendor => vendor.total_spend > 1000 && vendor.relationship_strength > 10) // Only meaningful relationships
          .sort((a, b) => b.total_spend - a.total_spend)
          .slice(0, 20) // Top 20 vendor relationships

        setData({ matrixData })
      } catch (err) {
        console.error('Error fetching vendor relationship matrix:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch relationship matrix')
      } finally {
        setLoading(false)
      }
    }

    fetchRelationshipMatrix()
  }, [locationIds])

  return { data, loading, error }
}

/**
 * Hook for vendor operational metrics
 */
export function useVendorOperationalMetrics(locationIds?: string[]): VendorAPIResponse<{ 
  vendorMetrics: Array<{
    vendor_id: string
    vendor_name: string
    avg_response_time: number
    service_level: number
    process_efficiency: number
    reliability_score: number
    operational_score: number
    avg_payment_days?: number
    payment_completion_rate?: number
    cash_conversion_days?: number
    payment_processing_score?: number
  }>
  radarData: Array<{
    subject: string
    topPerformer: number
    average: number
  }>
}> {
  const [data, setData] = useState<{ 
    vendorMetrics: Array<{
      vendor_id: string
      vendor_name: string
      avg_response_time: number
      service_level: number
      process_efficiency: number
      reliability_score: number
      operational_score: number
    }>
    radarData: Array<{
      subject: string
      topPerformer: number
      average: number
    }>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOperationalMetrics() {
      try {
        setLoading(true)
        setError(null)

        // Convert location names to location IDs if needed
        const locationIdsToFilter = await convertLocationNamesToIds(locationIds || [])

        // Get bills with timing and status data
        let query = supabase
          .from('vendor_bills_filtered')
          .select('vendor_id, bill_date, bill_status, age_in_days, total_bcy')
          .not('vendor_id', 'is', null)
          .not('bill_date', 'is', null)

        if (locationIdsToFilter.length > 0) {
          query = query.in('location_id', locationIdsToFilter)
        }

        const { data: billsData, error: billsError } = await query

        if (billsError) throw billsError

        // Get vendor names
        const { data: vendorsData, error: vendorsError } = await supabase
          .from('vendors')
          .select('vendor_id, vendor_name')

        if (vendorsError) throw vendorsError

        const vendorLookup = new Map(vendorsData?.map(v => [v.vendor_id, v.vendor_name]) || [])

        // Calculate operational metrics per vendor
        const vendorOperations = new Map<string, {
          vendor_name: string
          total_bills: number
          completed_bills: number
          avg_completion_time: number
          consistency_variance: number
          recent_performance: number
          bill_amounts: number[]
        }>()

        const currentDate = new Date()
        const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000)

        billsData?.forEach(bill => {
          if (!bill.vendor_id) return

          const existing = vendorOperations.get(bill.vendor_id) || {
            vendor_name: vendorLookup.get(bill.vendor_id) || `Vendor ${bill.vendor_id.slice(-4)}`,
            total_bills: 0,
            completed_bills: 0,
            avg_completion_time: 0,
            consistency_variance: 0,
            recent_performance: 0,
            bill_amounts: [] as number[]
          }

          const billDate = parseDate(bill.bill_date)
          const ageDays = parseInt(bill.age_in_days || '0')

          existing.total_bills++
          existing.bill_amounts.push(parseCurrencyValue(bill.total_bcy))

          if (bill.bill_status === 'Paid') {
            existing.completed_bills++
            existing.avg_completion_time = (existing.avg_completion_time + ageDays) / 2
          }

          // Track recent performance (last 30 days)
          if (billDate >= thirtyDaysAgo) {
            if (bill.bill_status === 'Paid' && ageDays <= 30) {
              existing.recent_performance += 2 // Good recent performance
            } else if (bill.bill_status === 'Overdue') {
              existing.recent_performance -= 1 // Poor recent performance
            }
          }

          vendorOperations.set(bill.vendor_id, existing)
        })

        // Convert to operational metrics with calculated scores
        const vendorMetrics = Array.from(vendorOperations.entries())
          .map(([vendor_id, metrics]) => {
            // Response Time (inverse of completion time, capped at reasonable range)
            const avg_response_time = Math.min(Math.max(metrics.avg_completion_time || 45, 1), 90)

            // Service Level (completion rate percentage)
            const service_level = metrics.total_bills > 0 
              ? Math.round((metrics.completed_bills / metrics.total_bills) * 100)
              : 0

            // Process Efficiency (based on consistency and speed)
            const efficiency_factor = Math.max(100 - (avg_response_time - 30), 0) // Penalty for slow response
            const completion_bonus = Math.min(service_level * 0.8, 80) // Max 80 points from completion rate
            const process_efficiency = Math.round(Math.min(efficiency_factor + completion_bonus, 100))

            // Reliability Score (based on recent performance and consistency)
            const consistency_score = Math.max(80 - Math.abs(metrics.recent_performance) * 5, 20)
            const volume_reliability = Math.min(metrics.total_bills * 2, 40) // More bills = more reliable data
            const reliability_score = Math.round(Math.min(consistency_score + volume_reliability, 100))

            // Overall Operational Score (weighted average)
            const operational_score = Math.round(
              (service_level * 0.3) + 
              (process_efficiency * 0.3) + 
              (reliability_score * 0.2) + 
              (Math.max(100 - avg_response_time, 0) * 0.2)
            )

            return {
              vendor_id,
              vendor_name: metrics.vendor_name,
              avg_response_time,
              service_level,
              process_efficiency,
              reliability_score,
              operational_score
            }
          })
          .filter(vendor => vendor.service_level > 0) // Only vendors with actual data
          .sort((a, b) => b.operational_score - a.operational_score)
          .slice(0, 15) // Top 15 vendors

        // Create radar chart data for comparison
        const topPerformer = vendorMetrics[0]
        const avgMetrics = {
          response_time: Math.round(vendorMetrics.reduce((sum, v) => sum + v.avg_response_time, 0) / vendorMetrics.length),
          service_level: Math.round(vendorMetrics.reduce((sum, v) => sum + v.service_level, 0) / vendorMetrics.length),
          process_efficiency: Math.round(vendorMetrics.reduce((sum, v) => sum + v.process_efficiency, 0) / vendorMetrics.length),
          reliability_score: Math.round(vendorMetrics.reduce((sum, v) => sum + v.reliability_score, 0) / vendorMetrics.length)
        }

        const radarData = [
          {
            subject: 'Response Time',
            topPerformer: Math.max(100 - topPerformer?.avg_response_time || 0, 0),
            average: Math.max(100 - avgMetrics.response_time, 0)
          },
          {
            subject: 'Service Level',
            topPerformer: topPerformer?.service_level || 0,
            average: avgMetrics.service_level
          },
          {
            subject: 'Process Efficiency',
            topPerformer: topPerformer?.process_efficiency || 0,
            average: avgMetrics.process_efficiency
          },
          {
            subject: 'Reliability',
            topPerformer: topPerformer?.reliability_score || 0,
            average: avgMetrics.reliability_score
          },
          {
            subject: 'Overall Score',
            topPerformer: topPerformer?.operational_score || 0,
            average: Math.round(vendorMetrics.reduce((sum, v) => sum + v.operational_score, 0) / vendorMetrics.length)
          }
        ]

        setData({ vendorMetrics, radarData })
      } catch (err) {
        console.error('Error fetching vendor operational metrics:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch operational metrics')
      } finally {
        setLoading(false)
      }
    }

    fetchOperationalMetrics()
  }, [locationIds])

  return { data, loading, error }
}

/**
 * Hook for vendor action recommendations
 */
export function useVendorActionRecommendations(locationIds?: string[]): VendorAPIResponse<{ 
  recommendations: Array<{
    title: string
    description: string
    priority: 'Critical' | 'High' | 'Medium' | 'Low'
    action_type: 'Risk Management' | 'Performance Optimization' | 'Cost Reduction' | 'Process Improvement' | 'Relationship Enhancement'
    affected_vendors: string[]
    estimated_effort: string
    potential_impact: {
      cost_savings?: number
      risk_reduction?: string
      performance_improvement?: string
    }
  }>
  categoryBreakdown: Record<string, number>
  keyInsights: string[]
}> {
  const [data, setData] = useState<{ 
    recommendations: Array<{
      title: string
      description: string
      priority: 'Critical' | 'High' | 'Medium' | 'Low'
      action_type: 'Risk Management' | 'Performance Optimization' | 'Cost Reduction' | 'Process Improvement' | 'Relationship Enhancement'
      affected_vendors: string[]
      estimated_effort: string
      potential_impact: {
        cost_savings?: number
        risk_reduction?: string
        performance_improvement?: string
      }
    }>
    categoryBreakdown: Record<string, number>
    keyInsights: string[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchActionRecommendations() {
      try {
        setLoading(true)
        setError(null)

        // Convert location names to location IDs if needed
        const locationIdsToFilter = await convertLocationNamesToIds(locationIds || [])

        // Get comprehensive vendor data for analysis
        let query = supabase
          .from('vendor_bills_filtered')
          .select('vendor_id, bill_date, bill_status, age_in_days, total_bcy')
          .not('vendor_id', 'is', null)

        if (locationIdsToFilter.length > 0) {
          query = query.in('location_id', locationIdsToFilter)
        }

        const { data: billsData, error: billsError } = await query

        if (billsError) throw billsError

        // Get vendor names
        const { data: vendorsData, error: vendorsError } = await supabase
          .from('vendors')
          .select('vendor_id, vendor_name')

        if (vendorsError) throw vendorsError

        const vendorLookup = new Map(vendorsData?.map(v => [v.vendor_id, v.vendor_name]) || [])

        // Analyze vendor performance and generate recommendations
        const vendorAnalysis = new Map<string, {
          vendor_name: string
          total_bills: number
          overdue_bills: number
          total_spend: number
          avg_payment_days: number
          overdue_percentage: number
          spend_percentage: number
          recent_activity: number
          consistency_issues: boolean
        }>()

        const totalSpend = billsData?.reduce((sum, bill) => sum + parseCurrencyValue(bill.total_bcy), 0) || 0
        const currentDate = new Date()
        const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000)

        // Analyze each vendor
        billsData?.forEach(bill => {
          if (!bill.vendor_id) return

          const existing = vendorAnalysis.get(bill.vendor_id) || {
            vendor_name: vendorLookup.get(bill.vendor_id) || `Vendor ${bill.vendor_id.slice(-4)}`,
            total_bills: 0,
            overdue_bills: 0,
            total_spend: 0,
            avg_payment_days: 0,
            overdue_percentage: 0,
            spend_percentage: 0,
            recent_activity: 0,
            consistency_issues: false
          }

          const billDate = parseDate(bill.bill_date)
          const amount = parseCurrencyValue(bill.total_bcy)
          const ageDays = parseInt(bill.age_in_days || '0')

          existing.total_bills++
          existing.total_spend += amount
          existing.avg_payment_days = (existing.avg_payment_days + ageDays) / 2

          if (bill.bill_status === 'Overdue') {
            existing.overdue_bills++
          }

          if (billDate >= thirtyDaysAgo) {
            existing.recent_activity++
          }

          // Check for consistency issues (high variance in payment days)
          if (ageDays > existing.avg_payment_days * 2 || ageDays < existing.avg_payment_days * 0.5) {
            existing.consistency_issues = true
          }

          vendorAnalysis.set(bill.vendor_id, existing)
        })

        // Calculate percentages and generate recommendations
        const recommendations: Array<{
          title: string
          description: string
          priority: 'Critical' | 'High' | 'Medium' | 'Low'
          action_type: 'Risk Management' | 'Performance Optimization' | 'Cost Reduction' | 'Process Improvement' | 'Relationship Enhancement'
          affected_vendors: string[]
          estimated_effort: string
          potential_impact: {
            cost_savings?: number
            risk_reduction?: string
            performance_improvement?: string
          }
        }> = []

        // Update vendor analysis with percentages
        vendorAnalysis.forEach((vendor, vendorId) => {
          vendor.overdue_percentage = vendor.total_bills > 0 ? (vendor.overdue_bills / vendor.total_bills) * 100 : 0
          vendor.spend_percentage = totalSpend > 0 ? (vendor.total_spend / totalSpend) * 100 : 0
        })

        // Generate specific recommendations based on analysis

        // 1. High overdue rate vendors
        const highOverdueVendors = Array.from(vendorAnalysis.values())
          .filter(v => v.overdue_percentage > 30 && v.total_bills >= 5)
          .sort((a, b) => b.overdue_percentage - a.overdue_percentage)
          .slice(0, 5)

        if (highOverdueVendors.length > 0) {
          recommendations.push({
            title: 'Address Critical Payment Issues',
            description: `${highOverdueVendors.length} vendors have overdue rates exceeding 30%. Immediate intervention required to prevent service disruptions.`,
            priority: 'Critical',
            action_type: 'Risk Management',
            affected_vendors: highOverdueVendors.map(v => v.vendor_name),
            estimated_effort: '1-2 weeks',
            potential_impact: {
              risk_reduction: 'High - Prevents service disruptions',
              cost_savings: Math.round(highOverdueVendors.reduce((sum, v) => sum + v.total_spend * 0.05, 0)) // 5% potential savings
            }
          })
        }

        // 2. High concentration risk vendors
        const highConcentrationVendors = Array.from(vendorAnalysis.values())
          .filter(v => v.spend_percentage > 15)
          .sort((a, b) => b.spend_percentage - a.spend_percentage)

        if (highConcentrationVendors.length > 0) {
          recommendations.push({
            title: 'Diversify Vendor Portfolio',
            description: `${highConcentrationVendors.length} vendors represent over 15% of total spend each. Consider supplier diversification to reduce dependency risk.`,
            priority: highConcentrationVendors[0].spend_percentage > 25 ? 'High' : 'Medium',
            action_type: 'Risk Management',
            affected_vendors: highConcentrationVendors.map(v => v.vendor_name),
            estimated_effort: '2-3 months',
            potential_impact: {
              risk_reduction: 'Medium - Reduces dependency risk',
              cost_savings: Math.round(highConcentrationVendors.reduce((sum, v) => sum + v.total_spend * 0.03, 0)) // 3% potential savings
            }
          })
        }

        // 3. Slow payment vendors (opportunity for early payment discounts)
        const slowPaymentVendors = Array.from(vendorAnalysis.values())
          .filter(v => v.avg_payment_days > 45 && v.overdue_percentage < 10) // Slow but not problematic
          .sort((a, b) => b.avg_payment_days - a.avg_payment_days)
          .slice(0, 3)

        if (slowPaymentVendors.length > 0) {
          recommendations.push({
            title: 'Negotiate Early Payment Discounts',
            description: `${slowPaymentVendors.length} vendors have average payment cycles over 45 days. Negotiate early payment discounts for mutual benefit.`,
            priority: 'Medium',
            action_type: 'Cost Reduction',
            affected_vendors: slowPaymentVendors.map(v => v.vendor_name),
            estimated_effort: '3-4 weeks',
            potential_impact: {
              cost_savings: Math.round(slowPaymentVendors.reduce((sum, v) => sum + v.total_spend * 0.02, 0)), // 2% potential savings
              performance_improvement: 'Improved cash flow management'
            }
          })
        }

        // 4. Inconsistent vendors (process improvement)
        const inconsistentVendors = Array.from(vendorAnalysis.values())
          .filter(v => v.consistency_issues && v.total_bills >= 5)
          .slice(0, 4)

        if (inconsistentVendors.length > 0) {
          recommendations.push({
            title: 'Standardize Vendor Processes',
            description: `${inconsistentVendors.length} vendors show inconsistent payment patterns. Implement standardized processes to improve predictability.`,
            priority: 'Medium',
            action_type: 'Process Improvement',
            affected_vendors: inconsistentVendors.map(v => v.vendor_name),
            estimated_effort: '4-6 weeks',
            potential_impact: {
              performance_improvement: 'Improved process efficiency and predictability'
            }
          })
        }

        // 5. Inactive vendors (relationship enhancement)
        const inactiveVendors = Array.from(vendorAnalysis.values())
          .filter(v => v.recent_activity === 0 && v.total_bills > 0)
          .slice(0, 3)

        if (inactiveVendors.length > 0) {
          recommendations.push({
            title: 'Reactivate Strategic Vendor Relationships',
            description: `${inactiveVendors.length} vendors have no recent activity. Evaluate for potential reactivation or contract cleanup.`,
            priority: 'Low',
            action_type: 'Relationship Enhancement',
            affected_vendors: inactiveVendors.map(v => v.vendor_name),
            estimated_effort: '2-3 weeks',
            potential_impact: {
              performance_improvement: 'Improved vendor portfolio management'
            }
          })
        }

        // 6. High-performing vendors (relationship enhancement)
        const highPerformingVendors = Array.from(vendorAnalysis.values())
          .filter(v => v.overdue_percentage < 5 && v.total_spend > totalSpend * 0.05)
          .sort((a, b) => b.total_spend - a.total_spend)
          .slice(0, 3)

        if (highPerformingVendors.length > 0) {
          recommendations.push({
            title: 'Strengthen Strategic Partnerships',
            description: `${highPerformingVendors.length} high-performing vendors offer partnership opportunities. Consider strategic agreements or volume discounts.`,
            priority: 'Medium',
            action_type: 'Relationship Enhancement',
            affected_vendors: highPerformingVendors.map(v => v.vendor_name),
            estimated_effort: '6-8 weeks',
            potential_impact: {
              cost_savings: Math.round(highPerformingVendors.reduce((sum, v) => sum + v.total_spend * 0.07, 0)), // 7% potential savings
              performance_improvement: 'Enhanced service levels and innovation'
            }
          })
        }

        // 7. Payment optimization recommendation
        const totalOverdueBills = Array.from(vendorAnalysis.values()).reduce((sum, v) => sum + v.overdue_bills, 0)
        const avgPaymentDays = Array.from(vendorAnalysis.values()).reduce((sum, v) => sum + v.avg_payment_days, 0) / vendorAnalysis.size

        if (avgPaymentDays > 40) {
          recommendations.push({
            title: 'Optimize Payment Processing',
            description: `Average payment cycle is ${Math.round(avgPaymentDays)} days. Implement automated payment systems to reduce processing time.`,
            priority: avgPaymentDays > 60 ? 'High' : 'Medium',
            action_type: 'Process Improvement',
            affected_vendors: ['All Vendors'],
            estimated_effort: '8-12 weeks',
            potential_impact: {
              cost_savings: Math.round(totalSpend * 0.01), // 1% operational savings
              performance_improvement: 'Reduced administrative overhead'
            }
          })
        }

        // Calculate category breakdown
        const categoryBreakdown = recommendations.reduce((acc, rec) => {
          acc[rec.action_type] = (acc[rec.action_type] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        // Generate key insights
        const keyInsights = [
          `${vendorAnalysis.size} active vendors analyzed with ${Math.round(totalSpend).toLocaleString()} SAR total spend`,
          `${recommendations.filter(r => r.priority === 'Critical' || r.priority === 'High').length} high-priority actions identified`,
          `Potential savings of ${Math.round(recommendations.reduce((sum, r) => sum + (r.potential_impact.cost_savings || 0), 0)).toLocaleString()} SAR available`,
          avgPaymentDays > 45 ? 'Payment processing optimization could significantly improve cash flow' : 'Payment processing is within acceptable ranges'
        ]

        setData({ recommendations, categoryBreakdown, keyInsights })
      } catch (err) {
        console.error('Error fetching vendor action recommendations:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch action recommendations')
      } finally {
        setLoading(false)
      }
    }

    fetchActionRecommendations()
  }, [locationIds])

  return { data, loading, error }
}