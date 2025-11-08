"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useLocale } from "@/i18n/locale-provider"
import { AlertTriangle, DollarSign, Clock, Target, TrendingUp, Search } from "lucide-react"

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('SAR', 'SAR ')
}

// Helper function to parse currency values like "SAR 3,446.21" to numbers
const parseCurrencyValue = (value: string | null | undefined): number => {
  if (!value) return 0
  // Remove currency prefix and commas, then parse as float
  const cleanValue = value.replace(/^SAR\s*/, '').replace(/,/g, '')
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

interface VendorAgingData {
  vendor_id: string
  vendor_name: string
  total_outstanding: number
  current_0_30: number
  days_31_60: number
  days_61_90: number
  over_90: number
  total_bills: number
  overdue_bills: number
  avg_bill_age: number
  last_bill_date?: string
  risk_category: 'Low' | 'Medium' | 'High' | 'Critical'
}

interface VendorAgingBalanceProps {
  locationIds?: string[]
}

export function VendorAgingBalance({ locationIds }: VendorAgingBalanceProps = {}) {
  const { t } = useLocale()
  const [selectedRisk, setSelectedRisk] = React.useState<string>("All")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [vendorData, setVendorData] = React.useState<VendorAgingData[]>([])
  const [riskCategories] = React.useState<string[]>(["All", "Critical", "High", "Medium", "Low"])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Fetch vendor aging data using balance_bcy - SWEETS Simplified (no payments_made table)
  React.useEffect(() => {
    const fetchVendorData = async () => {
      try {
        setLoading(true)

        // Convert location names to location IDs if needed
        let locationIdsToFilter: string[] = []
        if (locationIds && locationIds.length > 0) {
          const { data: branchData, error: branchError } = await supabase
            .from('branch')
            .select('location_id, location_name')
            .in('location_name', locationIds)

          if (branchError) {
            console.error('Error fetching branch IDs:', branchError)
          } else {
            locationIdsToFilter = branchData?.map(b => b.location_id) || []
          }
        }

        // Get bills with vendor data using the view
        let query = supabase
          .from('vendor_bills_filtered')
          .select('*')

        if (locationIdsToFilter.length > 0) {
          query = query.in('location_id', locationIdsToFilter)
        }

        const { data: billsData, error: billsError } = await query

        if (billsError) throw billsError

        // Calculate aging data per vendor using balance_bcy
        const vendorAging = new Map<string, {
          vendor_name: string
          total_outstanding: number
          current_0_30: number
          days_31_60: number
          days_61_90: number
          over_90: number
          total_bills: number
          overdue_bills: number
          bill_age_total: number
          bill_age_count: number
          last_bill_date: Date | null
        }>()

        const currentDate = new Date()

        billsData?.forEach(bill => {
          if (!bill.vendor_id) return

          const vendorName = bill.vendor_name || `Vendor ${bill.vendor_id.slice(-4)}`
          const balanceAmount = parseCurrencyValue(bill.balance_bcy)
          const billDate = parseDate(bill.bill_date)
          const daysOld = billDate ? Math.floor((currentDate.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

          const existing = vendorAging.get(bill.vendor_id) || {
            vendor_name: vendorName,
            total_outstanding: 0,
            current_0_30: 0,
            days_31_60: 0,
            days_61_90: 0,
            over_90: 0,
            total_bills: 0,
            overdue_bills: 0,
            bill_age_total: 0,
            bill_age_count: 0,
            last_bill_date: null
          }

          existing.total_bills++
          existing.total_outstanding += balanceAmount

          // Track last bill date
          if (billDate && (!existing.last_bill_date || billDate > existing.last_bill_date)) {
            existing.last_bill_date = billDate
          }

          // Track bill ages for average calculation
          if (daysOld > 0) {
            existing.bill_age_total += daysOld
            existing.bill_age_count++
          }

          // Only count balance amounts in aging buckets
          if (balanceAmount > 0) {
            if (daysOld <= 30) {
              existing.current_0_30 += balanceAmount
            } else if (daysOld <= 60) {
              existing.days_31_60 += balanceAmount
            } else if (daysOld <= 90) {
              existing.days_61_90 += balanceAmount
            } else {
              existing.over_90 += balanceAmount
            }
          }

          if (bill.bill_status === 'Overdue') {
            existing.overdue_bills++
          }

          vendorAging.set(bill.vendor_id, existing)
        })

        // Convert to array and calculate risk categories
        const agingData: VendorAgingData[] = Array.from(vendorAging.entries())
          .map(([vendor_id, data]) => {
            const totalOutstanding = data.total_outstanding
            const over90Percentage = totalOutstanding > 0 ? (data.over_90 / totalOutstanding) * 100 : 0
            const overduePercentage = data.total_bills > 0 ? (data.overdue_bills / data.total_bills) * 100 : 0
            const avgBillAge = data.bill_age_count > 0 ? Math.round(data.bill_age_total / data.bill_age_count) : 0

            let risk_category: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low'
            if (over90Percentage > 70 || overduePercentage > 80) {
              risk_category = 'Critical'
            } else if (over90Percentage > 40 || overduePercentage > 50) {
              risk_category = 'High'
            } else if (over90Percentage > 20 || overduePercentage > 30) {
              risk_category = 'Medium'
            }

            return {
              vendor_id,
              vendor_name: data.vendor_name,
              total_outstanding: Math.round(data.total_outstanding),
              current_0_30: Math.round(data.current_0_30),
              days_31_60: Math.round(data.days_31_60),
              days_61_90: Math.round(data.days_61_90),
              over_90: Math.round(data.over_90),
              total_bills: data.total_bills,
              overdue_bills: data.overdue_bills,
              avg_bill_age: avgBillAge,
              last_bill_date: data.last_bill_date?.toLocaleDateString() || 'No bills',
              risk_category
            }
          })
          .filter(vendor => vendor.total_outstanding > 0)
          .sort((a, b) => b.total_outstanding - a.total_outstanding)

        setVendorData(agingData)
      } catch (err) {
        console.error('Error fetching vendor aging data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchVendorData()
  }, [locationIds])

  const filteredData = React.useMemo(() => {
    let filtered = vendorData
    
    // Filter by risk category
    if (selectedRisk !== "All") {
      filtered = filtered.filter(vendor => vendor.risk_category === selectedRisk)
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(vendor => 
        vendor.vendor_name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    }
    
    return filtered
  }, [vendorData, selectedRisk, searchQuery])

  const totals = React.useMemo(() => {
    return filteredData.reduce(
      (acc, vendor) => ({
        total_outstanding: acc.total_outstanding + vendor.total_outstanding,
        current_0_30: acc.current_0_30 + vendor.current_0_30,
        days_31_60: acc.days_31_60 + vendor.days_31_60,
        days_61_90: acc.days_61_90 + vendor.days_61_90,
        over_90: acc.over_90 + vendor.over_90,
        total_bills: acc.total_bills + vendor.total_bills,
        vendors_count: filteredData.length
      }),
      { total_outstanding: 0, current_0_30: 0, days_31_60: 0, days_61_90: 0, over_90: 0, total_bills: 0, vendors_count: 0 }
    )
  }, [filteredData])

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'bg-destructive text-destructive-foreground'
      case 'High': return 'bg-warning text-warning-foreground'
      case 'Medium': return 'bg-accent text-accent-foreground'
      case 'Low': return 'bg-green-500 text-white'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {t("vendors.aging.title")}
          </CardTitle>
          <CardDescription>{t("vendors.aging.loading_aging_analysis")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-64" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            {t("vendors.aging.title")}
          </CardTitle>
          <CardDescription>{t("vendors.aging.error_loading_aging")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">{t("common.error")}: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center w-full max-w-full overflow-x-hidden">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-primary" />
              <span className="truncate">{t("vendors.aging.title")}</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t("vendors.aging.description")}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground font-medium">{t("vendors.aging.search_vendors")}</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("vendors.aging.search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-10 min-h-[44px]"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground font-medium">{t("vendors.aging.filter_by_risk")}</span>
              <Select value={selectedRisk} onValueChange={setSelectedRisk}>
                <SelectTrigger className="w-full sm:w-40 min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {riskCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "All" ? t("vendors.risk_levels.all") : 
                       category === "Critical" ? t("vendors.risk_levels.critical") :
                       category === "High" ? t("vendors.risk_levels.high") :
                       category === "Medium" ? t("vendors.risk_levels.medium") :
                       category === "Low" ? t("vendors.risk_levels.low") : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge variant="outline" className="self-start sm:self-auto bg-primary text-primary-foreground border-primary">
              {totals.vendors_count} {t("vendors.aging.vendors")}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-full overflow-x-hidden">
          <div className="p-3 sm:p-4 rounded-lg w-full max-w-full overflow-x-hidden bg-primary text-primary-foreground">
            <div className="text-lg sm:text-2xl font-bold break-all">{formatCurrency(totals.total_outstanding)}</div>
            <div className="text-xs sm:text-sm opacity-90">{t("vendors.aging.total_outstanding")}</div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg w-full max-w-full overflow-x-hidden bg-green-600 text-white dark:bg-green-700">
            <div className="text-lg sm:text-2xl font-bold break-all">{formatCurrency(totals.current_0_30)}</div>
            <div className="text-xs sm:text-sm opacity-90">{t("vendors.aging.current_0_30")}</div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg w-full max-w-full overflow-x-hidden bg-yellow-600 text-white dark:bg-yellow-700">
            <div className="text-lg sm:text-2xl font-bold break-all">{formatCurrency(totals.days_31_60 + totals.days_61_90)}</div>
            <div className="text-xs sm:text-sm opacity-90">{t("vendors.aging.days_31_60")}</div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg w-full max-w-full overflow-x-hidden bg-red-600 text-white dark:bg-red-700">
            <div className="text-lg sm:text-2xl font-bold break-all">{formatCurrency(totals.over_90)}</div>
            <div className="text-xs sm:text-sm opacity-90">{t("vendors.aging.over_90")}</div>
          </div>
        </div>

        {/* Aging Table */}
        {/* Mobile View */}
        <div className="md:hidden">
          <div className="space-y-3">
            {filteredData.map((vendor, index) => (
              <div key={vendor.vendor_id} className="bg-muted/30 dark:bg-muted/50 p-4 rounded-lg space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-muted dark:bg-muted/80 px-1.5 py-0.5 rounded flex-shrink-0">
                      #{index + 1}
                    </span>
                    <h4 className="font-bold text-base sm:text-lg text-foreground leading-tight flex-1 min-w-0">
                      {vendor.vendor_name}
                    </h4>
                    <Badge className={getRiskBadgeColor(vendor.risk_category)} size="sm">
                      {vendor.risk_category}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">
                          {vendor.avg_bill_age > 0 ? `${vendor.avg_bill_age} ${t("pages.vendors.days_avg")}` : t("pages.vendors.no_bill_data")}
                        </span>
                      </div>
                      <div>{t("vendors.aging.last_bill")}: <span className="font-medium text-blue-600 dark:text-blue-400">{vendor.last_bill_date}</span></div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className="font-bold text-lg">{formatCurrency(vendor.total_outstanding)}</div>
                      <div className="text-xs text-muted-foreground">{t("vendors.aging.total_outstanding")}</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground">{t("vendors.aging.current_0_30")}:</div>
                    <div className="font-medium">{formatCurrency(vendor.current_0_30)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("vendors.aging.days_31_60")}:</div>
                    <div className="font-medium">{formatCurrency(vendor.days_31_60)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("vendors.aging.days_61_90")}:</div>
                    <div className="font-medium">{formatCurrency(vendor.days_61_90)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("vendors.aging.over_90")}:</div>
                    <div className="font-medium text-red-600 dark:text-red-400">{formatCurrency(vendor.over_90)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Desktop View */}
        <div className="hidden md:block rounded-md border [&_td]:whitespace-normal [&_th]:whitespace-normal [&_[data-slot='table-container']]:overflow-hidden">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/50 border-b dark:border-gray-700">
                <TableHead className="font-semibold text-foreground whitespace-normal">{t("vendors.aging.vendor_details")}</TableHead>
                <TableHead className="text-right font-semibold text-foreground whitespace-normal">{t("vendors.aging.total_outstanding")}</TableHead>
                <TableHead className="text-right font-semibold text-foreground whitespace-normal">{t("vendors.aging.current_0_30")}</TableHead>
                <TableHead className="text-right font-semibold text-foreground whitespace-normal">{t("vendors.aging.days_31_60")}</TableHead>
                <TableHead className="text-right font-semibold text-foreground whitespace-normal">{t("vendors.aging.days_61_90")}</TableHead>
                <TableHead className="text-right font-semibold text-foreground whitespace-normal">{t("vendors.aging.over_90")}</TableHead>
                <TableHead className="text-center font-semibold text-foreground whitespace-normal">{t("vendors.aging.risk_level")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((vendor, index) => (
                <TableRow key={vendor.vendor_id} className="border-b hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold text-foreground">{vendor.vendor_name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                        <Clock className="h-3 w-3" />
                        {vendor.avg_bill_age > 0 ? `${vendor.avg_bill_age} ${t("pages.vendors.days_avg")}` : t("pages.vendors.no_bill_data")}
                      </div>
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <span className="font-medium">{t("vendors.aging.last_bill")}:</span> {vendor.last_bill_date}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-lg text-foreground">
                      {formatCurrency(vendor.total_outstanding)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-lg text-foreground">
                      {formatCurrency(vendor.current_0_30)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-lg text-foreground">
                      {formatCurrency(vendor.days_31_60)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-lg text-foreground">
                      {formatCurrency(vendor.days_61_90)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-lg text-foreground">
                      {formatCurrency(vendor.over_90)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={getRiskBadgeColor(vendor.risk_category)}>
                      {vendor.risk_category}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {/* Total Row */}
              <TableRow className="border-t-2 bg-muted/50">
                <TableCell className="font-bold text-foreground">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Total ({totals.vendors_count} vendors)
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-bold text-lg text-foreground">
                    {formatCurrency(totals.total_outstanding)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-lg text-foreground">
                    {formatCurrency(totals.current_0_30)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-lg text-foreground">
                    {formatCurrency(totals.days_31_60)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-lg text-foreground">
                    {formatCurrency(totals.days_61_90)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-lg text-foreground">
                    {formatCurrency(totals.over_90)}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-muted-foreground">
                    Summary
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Aging Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-accent/10 border border-accent/30">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">
              {Math.round((totals.over_90 / totals.total_outstanding) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Over 90 Days Risk</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">
              {totals.vendors_count}
            </div>
            <div className="text-sm text-muted-foreground">Active Vendors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">
              {Math.round((totals.current_0_30 / totals.total_outstanding) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Current Aging</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}