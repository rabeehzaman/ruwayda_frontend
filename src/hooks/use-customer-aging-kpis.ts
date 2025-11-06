"use client"

import * as React from 'react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import {
  CustomerAgingSummaryKPIs,
  TopOverdueCustomer,
  RiskCategoryDistribution,
  BranchPerformance
} from '@/types/customer-aging'

// Hook for fetching aging summary KPIs with owner filtering
export function useCustomerAgingSummaryKPIs(selectedOwners?: string[]) {
  const [data, setData] = useState<CustomerAgingSummaryKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: rawData } = useCustomerAgingData()

  useEffect(() => {
    const calculateFilteredKPIs = () => {
      if (!rawData || rawData.length === 0) {
        setData(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Filter data by selected owners
        const filteredData = !selectedOwners || selectedOwners.length === 0
          ? rawData
          : rawData.filter(customer => selectedOwners.includes(customer.customer_owner_name_custom))

        if (filteredData.length === 0) {
          setData({
            total_customers_with_balance: 0,
            total_receivables: '0',
            avg_balance_per_customer: '0',
            total_outstanding_invoices: 0,
            current_amount: '0',
            current_percentage: '0',
            current_customers_count: 0,
            past_due_31_60_amount: '0',
            past_due_31_60_percentage: '0',
            past_due_31_60_count: 0,
            past_due_61_90_amount: '0',
            past_due_61_90_percentage: '0',
            past_due_61_90_count: 0,
            past_due_91_180_amount: '0',
            past_due_91_180_percentage: '0',
            past_due_91_180_count: 0,
            over_180_amount: '0',
            over_180_percentage: '0',
            over_180_count: 0,
            high_risk_percentage: '0',
            avg_invoices_per_customer: '0',
            report_date: new Date().toISOString()
          })
          setLoading(false)
          return
        }

        // Calculate totals
        const totalReceivables = filteredData.reduce((sum, customer) => 
          sum + parseFloat(customer.total_balance.toString()), 0)
        
        const currentAmount = filteredData.reduce((sum, customer) => 
          sum + parseFloat(customer.current_0_30.toString()), 0)
        
        const pastDue31_60 = filteredData.reduce((sum, customer) => 
          sum + parseFloat(customer.past_due_31_60.toString()), 0)
        
        const pastDue61_90 = filteredData.reduce((sum, customer) => 
          sum + parseFloat(customer.past_due_61_90.toString()), 0)
        
        const pastDue91_180 = filteredData.reduce((sum, customer) => 
          sum + parseFloat(customer.past_due_91_180.toString()), 0)
        
        const over180 = filteredData.reduce((sum, customer) => 
          sum + parseFloat(customer.past_due_over_180.toString()), 0)

        // Calculate percentages
        const currentPercentage = totalReceivables > 0 ? (currentAmount / totalReceivables * 100).toFixed(2) : '0'
        const pastDue31_60Percentage = totalReceivables > 0 ? (pastDue31_60 / totalReceivables * 100).toFixed(2) : '0'
        const pastDue61_90Percentage = totalReceivables > 0 ? (pastDue61_90 / totalReceivables * 100).toFixed(2) : '0'
        const pastDue91_180Percentage = totalReceivables > 0 ? (pastDue91_180 / totalReceivables * 100).toFixed(2) : '0'
        const over180Percentage = totalReceivables > 0 ? (over180 / totalReceivables * 100).toFixed(2) : '0'
        const highRiskPercentage = totalReceivables > 0 ? (over180 / totalReceivables * 100).toFixed(2) : '0'

        // Count customers in each bucket
        const currentCount = filteredData.filter(c => parseFloat(c.current_0_30.toString()) > 0).length
        const pastDue31_60Count = filteredData.filter(c => parseFloat(c.past_due_31_60.toString()) > 0).length
        const pastDue61_90Count = filteredData.filter(c => parseFloat(c.past_due_61_90.toString()) > 0).length
        const pastDue91_180Count = filteredData.filter(c => parseFloat(c.past_due_91_180.toString()) > 0).length
        const over180Count = filteredData.filter(c => parseFloat(c.past_due_over_180.toString()) > 0).length

        setData({
          total_customers_with_balance: filteredData.length,
          total_receivables: totalReceivables.toFixed(2),
          avg_balance_per_customer: (totalReceivables / filteredData.length).toFixed(2),
          total_outstanding_invoices: filteredData.length, // Approximation
          current_amount: currentAmount.toFixed(2),
          current_percentage: currentPercentage,
          current_customers_count: currentCount,
          past_due_31_60_amount: pastDue31_60.toFixed(2),
          past_due_31_60_percentage: pastDue31_60Percentage,
          past_due_31_60_count: pastDue31_60Count,
          past_due_61_90_amount: pastDue61_90.toFixed(2),
          past_due_61_90_percentage: pastDue61_90Percentage,
          past_due_61_90_count: pastDue61_90Count,
          past_due_91_180_amount: pastDue91_180.toFixed(2),
          past_due_91_180_percentage: pastDue91_180Percentage,
          past_due_91_180_count: pastDue91_180Count,
          over_180_amount: over180.toFixed(2),
          over_180_percentage: over180Percentage,
          over_180_count: over180Count,
          high_risk_percentage: highRiskPercentage,
          avg_invoices_per_customer: (filteredData.length / filteredData.length).toFixed(2),
          report_date: new Date().toISOString()
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to calculate filtered KPIs')
      } finally {
        setLoading(false)
      }
    }

    calculateFilteredKPIs()
  }, [rawData, selectedOwners])

  return { data, loading, error }
}

// Hook for fetching top overdue customers
export function useTopOverdueCustomers(limit: number = 10) {
  const { permissions } = useAuth()
  const [data, setData] = useState<TopOverdueCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data: result, error } = await supabase
          .from('top_overdue_customers')
          .select('*')
          .limit(limit)

        if (error) throw error

        let filteredData = result || []

        // Filter by allowed customer owners if user has restricted permissions
        if (permissions?.allowedCustomerOwners &&
            permissions.allowedCustomerOwners.length > 0 &&
            !permissions.isAdmin) {
          filteredData = filteredData.filter(customer =>
            permissions.allowedCustomerOwners.includes(customer.sales_person)
          )
        }

        setData(filteredData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch top overdue customers')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [limit, permissions?.allowedCustomerOwners, permissions?.isAdmin])

  return { data, loading, error }
}

// Hook for fetching risk category distribution with filtering
export function useRiskCategoryDistribution(selectedOwners?: string[]) {
  const [data, setData] = useState<RiskCategoryDistribution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: rawData } = useCustomerAgingData()

  useEffect(() => {
    const calculateRiskDistribution = () => {
      if (!rawData || rawData.length === 0) {
        setData([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Filter data by selected owners
        const filteredData = !selectedOwners || selectedOwners.length === 0
          ? rawData
          : rawData.filter(customer => selectedOwners.includes(customer.customer_owner_name_custom))

        if (filteredData.length === 0) {
          setData([])
          setLoading(false)
          return
        }

        // Create risk categories based on aging
        const riskCategories = [
          { 
            risk_category: 'Current', 
            risk_level: 'Low' as const,
            category_order: 1,
            chart_color: '#22c55e',
            customers: filteredData.filter(c => {
              const total = parseFloat(c.total_balance.toString())
              const current = parseFloat(c.current_0_30.toString())
              return total > 0 && current === total
            })
          },
          { 
            risk_category: 'Low Risk', 
            risk_level: 'Low' as const,
            category_order: 2,
            chart_color: '#3b82f6',
            customers: filteredData.filter(c => {
              const pastDue31_60 = parseFloat(c.past_due_31_60.toString())
              return pastDue31_60 > 0
            })
          },
          { 
            risk_category: 'Medium Risk', 
            risk_level: 'Medium' as const,
            category_order: 3,
            chart_color: '#f59e0b',
            customers: filteredData.filter(c => {
              const pastDue61_90 = parseFloat(c.past_due_61_90.toString())
              return pastDue61_90 > 0
            })
          },
          { 
            risk_category: 'High Risk', 
            risk_level: 'High' as const,
            category_order: 4,
            chart_color: '#ef4444',
            customers: filteredData.filter(c => {
              const pastDue91_180 = parseFloat(c.past_due_91_180.toString())
              return pastDue91_180 > 0
            })
          },
          { 
            risk_category: 'Very High Risk', 
            risk_level: 'Very High' as const,
            category_order: 5,
            chart_color: '#dc2626',
            customers: filteredData.filter(c => {
              const over180 = parseFloat(c.past_due_over_180.toString())
              return over180 > 0
            })
          }
        ]

        const riskDistribution = riskCategories
          .map(category => ({
            risk_category: category.risk_category,
            risk_level: category.risk_level,
            customer_count: category.customers.length,
            total_amount: category.customers.reduce((sum, customer) => {
              const amount = parseFloat(customer.total_balance.toString())
              return sum + amount
            }, 0).toFixed(2),
            category_order: category.category_order,
            chart_color: category.chart_color
          }))
          .filter(category => category.customer_count > 0)

        setData(riskDistribution)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to calculate risk distribution')
      } finally {
        setLoading(false)
      }
    }

    calculateRiskDistribution()
  }, [rawData, selectedOwners])

  return { data, loading, error }
}

// Hook for fetching branch performance comparison
export function useBranchPerformance() {
  const [data, setData] = useState<BranchPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data: result, error } = await supabase
          .from('branch_performance_comparison')
          .select('*')
          .order('total_receivables', { ascending: false })

        if (error) throw error
        setData(result || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch branch performance data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}

// Hook for fetching raw customer aging data
interface CustomerAgingDataRecord {
  customer_id: string
  customer_name: string
  customer_owner_name_custom: string
  total_balance: string | number
  current_0_30: string | number
  past_due_31_60: string | number
  past_due_61_90: string | number
  past_due_91_180: string | number
  past_due_over_180: string | number
}

export function useCustomerAgingData() {
  const { permissions } = useAuth()
  const [data, setData] = useState<CustomerAgingDataRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data: result, error } = await supabase
          .from('customer_balance_aging_filtered')
          .select('*')
          .order('total_balance', { ascending: false })

        if (error) throw error

        let filteredData = result || []

        // Filter by allowed customer owners if user has restricted permissions
        if (permissions?.allowedCustomerOwners &&
            permissions.allowedCustomerOwners.length > 0 &&
            !permissions.isAdmin) {
          filteredData = filteredData.filter(customer =>
            permissions.allowedCustomerOwners.includes(customer.customer_owner_name_custom)
          )
        }

        setData(filteredData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch customer aging data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [permissions?.allowedCustomerOwners, permissions?.isAdmin])

  return { data, loading, error }
}

// Hook for getting available customer owners
export function useCustomerOwners() {
  const { permissions } = useAuth()
  const [owners, setOwners] = useState<string[]>(['All'])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        setLoading(true)

        // If user has restricted permissions, use their allowed list
        if (permissions?.allowedCustomerOwners && permissions.allowedCustomerOwners.length > 0 && !permissions.isAdmin) {
          setOwners(['All', ...permissions.allowedCustomerOwners])
          setLoading(false)
          return
        }

        // For admin users, fetch all owners from database
        const { data: result, error } = await supabase
          .from('customer_balance_aging_filtered')
          .select('customer_owner_name_custom')
          .not('customer_owner_name_custom', 'is', null)

        if (error) throw error

        const uniqueOwners = ['All', ...new Set(
          result?.map(item => item.customer_owner_name_custom).filter(Boolean) || []
        )]

        setOwners(uniqueOwners)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch customer owners')
      } finally {
        setLoading(false)
      }
    }

    fetchOwners()
  }, [permissions])

  return { owners, loading, error }
}

// Updated combined hook for all customer aging KPIs with filtering
export function useCustomerAgingDashboard(selectedOwners?: string[]) {
  const summaryKPIs = useCustomerAgingSummaryKPIs()
  const topOverdueCustomers = useTopOverdueCustomers(10)
  const riskDistribution = useRiskCategoryDistribution()
  const branchPerformance = useBranchPerformance()

  const loading = summaryKPIs.loading || topOverdueCustomers.loading ||
                 riskDistribution.loading || branchPerformance.loading

  const error = summaryKPIs.error || topOverdueCustomers.error ||
               riskDistribution.error || branchPerformance.error

  // Filter data by selected owners
  const filteredTopOverdueCustomers = React.useMemo(() => {
    if (!topOverdueCustomers.data || !selectedOwners || selectedOwners.length === 0) {
      return topOverdueCustomers.data
    }
    return topOverdueCustomers.data.filter(customer =>
      selectedOwners.includes(customer.sales_person)
    )
  }, [topOverdueCustomers.data, selectedOwners])

  return {
    summaryKPIs: summaryKPIs.data,
    topOverdueCustomers: filteredTopOverdueCustomers,
    riskDistribution: riskDistribution.data,
    branchPerformance: branchPerformance.data,
    loading,
    error
  }
}