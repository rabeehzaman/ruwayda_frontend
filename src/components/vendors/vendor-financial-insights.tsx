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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useVendorFinancialInsights } from "@/hooks/use-vendor-kpis"
import { useLocale } from "@/i18n/locale-provider"
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Activity,
  Wallet,
  CreditCard,
  Timer,
  Target
} from "lucide-react"

// Import formatCurrency from lib for consistent Saudi Riyal symbol usage
import { formatCurrency as formatCurrencySAR } from '@/lib/formatting'

const formatCurrency = (amount: number) => {
  return formatCurrencySAR(amount)
}

const getActivityColor = (status: string) => {
  switch (status) {
    case 'Very Recent':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'Recent':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'Moderate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'Inactive':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

const getTrendIcon = (trend: string) => {
  if (trend.includes('Improving')) return <TrendingUp className="h-3 w-3 text-green-600" />
  if (trend.includes('Deteriorating')) return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
  return <TrendingUp className="h-3 w-3 text-muted-foreground rotate-90" />
}

interface VendorFinancialInsightsProps {
  className?: string
}

export function VendorFinancialInsights({ className }: VendorFinancialInsightsProps) {
  const { t } = useLocale()
  const { data, loading, error } = useVendorFinancialInsights()

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            {t("vendors.financial_insights.title")}
          </CardTitle>
          <CardDescription>{t("vendors.financial_insights.loading_financial_data")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            {t("vendors.financial_insights.title")}
          </CardTitle>
          <CardDescription>{t("vendors.financial_insights.error_loading_financial")}</CardDescription>
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

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            {t("vendors.financial_insights.title")}
          </CardTitle>
          <CardDescription>{t("common.no_data_available")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">{t("vendors.financial_insights.no_financial_data")}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 w-full max-w-full overflow-x-hidden">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="truncate">{t("vendors.financial_insights.title")}</span>
            </CardTitle>
            <CardDescription className="text-sm">
              {t("vendors.financial_insights.description")}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="self-start sm:self-auto">
            {data.length} {t("vendors.aging.vendors")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Mobile View */}
        <div className="md:hidden">
          <div className="space-y-3">
            {data.map((vendor) => (
              <div key={vendor.vendor_id} className="bg-muted/30 dark:bg-muted/20 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base truncate">{vendor.vendor_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("vendors.aging.last_bill")}: {vendor.last_bill_date ? new Date(vendor.last_bill_date).toLocaleDateString() : t('common.n_a')}
                    </div>
                    {vendor.last_payment_date && (
                      <div className="text-xs text-green-600">
                        {t("vendors.aging.last_pay")}: {new Date(vendor.last_payment_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <Badge 
                    className={`text-xs ${getActivityColor(vendor.activity_status)} flex-shrink-0`}
                    variant="outline"
                  >
                    {vendor.activity_status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">{t("vendors.financial_insights.ytd_billed")}:</div>
                    <div className="font-medium break-all">{formatCurrency(vendor.total_spend_ytd)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("vendors.financial_insights.ytd_paid")}:</div>
                    <div className="font-medium text-green-600 break-all">
                      {vendor.total_paid_ytd ? formatCurrency(vendor.total_paid_ytd) : formatCurrency(0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("vendors.performance.outstanding")}:</div>
                    <div className={`font-medium break-all ${(vendor.outstanding_amount || 0) > 50000 ? 'text-destructive' : (vendor.outstanding_amount || 0) > 10000 ? 'text-warning' : 'text-green-600'}`}>
                      {vendor.outstanding_amount ? formatCurrency(vendor.outstanding_amount) : formatCurrency(0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("vendors.financial_insights.pay_rate")}:</div>
                    <div className={`font-medium ${(vendor.payment_completion_rate || 0) > 95 ? 'text-green-600' : (vendor.payment_completion_rate || 0) > 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {vendor.payment_completion_rate ? `${vendor.payment_completion_rate.toFixed(1)}%` : '0%'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("vendors.financial_insights.cash_days")}:</div>
                    <div className={`font-medium ${(vendor.cash_conversion_days || 999) > 60 ? 'text-red-600' : (vendor.cash_conversion_days || 999) > 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {vendor.cash_conversion_days ? `${vendor.cash_conversion_days}d` : t('common.n_a')}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("vendors.financial_insights.velocity")}:</div>
                    <div className={`font-medium ${(vendor.payment_velocity || 0) > 2 ? 'text-green-600' : (vendor.payment_velocity || 0) > 1 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {vendor.payment_velocity ? `${vendor.payment_velocity.toFixed(1)}/mo` : '0/mo'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs pt-2 border-t border-muted">
                  <div className="flex items-center gap-1">
                    {getTrendIcon(vendor.payment_trend)}
                    <span>{vendor.payment_trend.replace(/[⬇️⬆️➡️]/g, '').trim()}</span>
                  </div>
                  <div>
                    {vendor.bills_with_payments || 0} {t("vendors.financial_insights.of")} {vendor.total_bills || 0} {t("vendors.financial_insights.bills_paid")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Desktop View */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">{t("vendors.performance.vendor")}</TableHead>
                <TableHead className="text-right">{t("vendors.financial_insights.ytd_billed")}</TableHead>
                <TableHead className="text-right">{t("vendors.financial_insights.ytd_paid")}</TableHead>
                <TableHead className="text-right">{t("vendors.performance.outstanding")}</TableHead>
                <TableHead className="text-center">{t("vendors.financial_insights.pay_rate")}</TableHead>
                <TableHead className="text-center">{t("vendors.financial_insights.cash_days")}</TableHead>
                <TableHead className="text-center">{t("vendors.financial_insights.velocity")}</TableHead>
                <TableHead className="text-center">{t("vendors.performance.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((vendor) => (
                <TableRow key={vendor.vendor_id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold text-sm">
                        {vendor.vendor_name}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{t("vendors.aging.last_bill")}: {vendor.last_bill_date ? new Date(vendor.last_bill_date).toLocaleDateString() : t('common.n_a')}</span>
                        {vendor.last_payment_date && (
                          <span className="text-green-600">• {t("vendors.aging.last_pay")}: {new Date(vendor.last_payment_date).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {vendor.bills_with_payments || 0} {t("vendors.financial_insights.of")} {vendor.total_bills || 0} {t("vendors.financial_insights.bills_paid")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <div className="text-sm font-bold">
                      {formatCurrency(vendor.total_spend_ytd)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(vendor.avg_order_value)} {t("vendors.financial_insights.avg")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-sm font-semibold text-green-600">
                      {vendor.total_paid_ytd ? formatCurrency(vendor.total_paid_ytd) : formatCurrency(0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {vendor.payment_completion_rate ? `${vendor.payment_completion_rate.toFixed(1)}%` : '0%'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={`text-sm font-bold ${(vendor.outstanding_amount || 0) > 50000 ? 'text-destructive' : (vendor.outstanding_amount || 0) > 10000 ? 'text-warning' : 'text-green-600'}`}>
                      {vendor.outstanding_amount ? formatCurrency(vendor.outstanding_amount) : formatCurrency(0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {vendor.days_since_last_payment ? `${vendor.days_since_last_payment}d ${t("vendors.financial_insights.ago")}` : t("vendors.financial_insights.no_payments")}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={`text-sm font-bold ${(vendor.payment_completion_rate || 0) > 95 ? 'text-green-600' : (vendor.payment_completion_rate || 0) > 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {vendor.payment_completion_rate ? `${vendor.payment_completion_rate.toFixed(1)}%` : '0%'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={`text-sm font-bold ${(vendor.cash_conversion_days || 999) > 60 ? 'text-red-600' : (vendor.cash_conversion_days || 999) > 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {vendor.cash_conversion_days ? `${vendor.cash_conversion_days}d` : t('common.n_a')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('vendors.financial_insights.vs')} {vendor.credit_terms_days}d {t('vendors.financial_insights.terms')}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={`text-sm font-bold ${(vendor.payment_velocity || 0) > 2 ? 'text-green-600' : (vendor.payment_velocity || 0) > 1 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {vendor.payment_velocity ? `${vendor.payment_velocity.toFixed(1)}/mo` : '0/mo'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('vendors.financial_insights.frequency')}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      className={`text-xs ${getActivityColor(vendor.activity_status)}`}
                      variant="outline"
                    >
                      {vendor.activity_status}
                    </Badge>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {getTrendIcon(vendor.payment_trend)}
                      <span className="text-xs">
                        {vendor.payment_trend.replace(/[⬇️⬆️➡️]/g, '').trim()}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Enhanced Cash Flow Intelligence Summary */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-muted/30 rounded-lg w-full max-w-full overflow-x-hidden">
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold break-all text-blue-600">
              {formatCurrency(data.reduce((sum, v) => sum + v.total_spend_ytd, 0))}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <CreditCard className="h-3 w-3" />
              Total Billed YTD
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold break-all text-green-600">
              {formatCurrency(data.reduce((sum, v) => sum + (v.total_paid_ytd || 0), 0))}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Wallet className="h-3 w-3" />
              Total Paid YTD
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold break-all text-red-600">
              {formatCurrency(data.reduce((sum, v) => sum + (v.outstanding_amount || 0), 0))}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Outstanding
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold break-all text-purple-600">
              {data.length > 0 ? 
                ((data.reduce((sum, v) => sum + (v.total_paid_ytd || 0), 0) / 
                  data.reduce((sum, v) => sum + v.total_spend_ytd, 0)) * 100).toFixed(1)
                : '0'
              }%
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Target className="h-3 w-3" />
              Payment Rate
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold break-all text-accent">
              {data.filter(v => (v.cash_conversion_days || 999) <= 30).length}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Timer className="h-3 w-3" />
              Fast Payers (≤30d)
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold break-all text-yellow-600">
              {data.filter(v => v.payment_trend.includes('Improving')).length}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Improving Trends
            </div>
          </div>
        </div>

        {/* Cash Flow Intelligence Insights */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h5 className="text-sm font-medium mb-2 flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <DollarSign className="h-4 w-4" />
            Cash Flow Intelligence
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
            <div>
              <strong>High-Value Outstanding:</strong> {data.filter(v => (v.outstanding_amount || 0) > 50000).length} vendors with {formatCurrency(50000)}+ outstanding
            </div>
            <div>
              <strong>Payment Reliability:</strong> {data.filter(v => (v.payment_completion_rate || 0) > 95).length} vendors with 95%+ payment completion
            </div>
            <div>
              <strong>Cash Conversion:</strong> {data.filter(v => (v.cash_conversion_days || 999) <= 30).length} vendors convert cash within 30 days
            </div>
            <div>
              <strong>Payment Velocity:</strong> {data.filter(v => (v.payment_velocity || 0) > 2).length} vendors with high payment frequency ({">2/month"})
            </div>
          </div>
        </div>

        {/* Enhanced Legend with Payment Intelligence */}
        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Excellent Payment (95%+ completion)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Good Payment (80-94% completion)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Poor Payment ({"<80% completion"})</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <strong>Cash Days:</strong> Average days from bill to actual payment. 
            <strong>Velocity:</strong> Payment frequency per month. 
            <strong>Pay Rate:</strong> Percentage of billed amount actually paid.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}