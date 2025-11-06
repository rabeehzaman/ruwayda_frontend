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
import { useVendorPerformanceScorecard } from "@/hooks/use-vendor-kpis"
import { useLocale } from "@/i18n/locale-provider"
import { AlertTriangle, TrendingUp, Users, CreditCard, Target } from "lucide-react"

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-600'
  if (score >= 75) return 'text-yellow-600'
  if (score >= 60) return 'text-orange-600'
  return 'text-red-600'
}

const getScoreBadgeVariant = (status: string) => {
  if (status.includes('Excellent')) return 'default'
  if (status.includes('Good')) return 'secondary'
  if (status.includes('Average')) return 'outline'
  return 'destructive'
}

interface VendorPerformanceScorecardProps {
  className?: string
}

export function VendorPerformanceScorecard({ className }: VendorPerformanceScorecardProps) {
  const { t } = useLocale()
  const { data, loading, error } = useVendorPerformanceScorecard()

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            {t("vendors.performance.title")}
          </CardTitle>
          <CardDescription>{t("vendors.performance.loading_performance_data")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-24" />
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
            {t("vendors.performance.title")}
          </CardTitle>
          <CardDescription>{t("vendors.performance.error_loading_performance")}</CardDescription>
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
            <TrendingUp className="h-5 w-5 text-blue-600" />
            {t("vendors.performance.title")}
          </CardTitle>
          <CardDescription>{t("vendors.performance.no_performance_data")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">{t("vendors.performance.no_vendor_performance_found")}</p>
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
              <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span className="truncate">{t("vendors.performance.title")}</span>
            </CardTitle>
            <CardDescription className="text-sm">
              {t("vendors.performance.description")}
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
            {data.map((vendor, index) => (
              <div key={vendor.vendor_id} className="bg-muted/30 dark:bg-muted/20 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base truncate">{vendor.vendor_name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{t('common.id')}: {vendor.vendor_id.slice(-8)}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(vendor.performance_score)}`}>
                        {vendor.performance_score}
                      </div>
                      <div className="text-xs text-muted-foreground">{t("vendors.performance.score")}</div>
                    </div>
                    <Badge variant={getScoreBadgeVariant(vendor.vendor_status)} className="text-xs">
                      {vendor.vendor_status}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">{t("vendors.performance.bills")}:</div>
                    <div className="font-medium">{vendor.total_bills}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("vendors.performance.pay_days")}:</div>
                    <div className={`font-medium ${vendor.avg_payment_days > 60 ? 'text-red-600' : vendor.avg_payment_days > 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {vendor.avg_payment_days}d
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("vendors.performance.overdue")}:</div>
                    <div className={`font-medium ${vendor.overdue_percentage > 15 ? 'text-red-600' : vendor.overdue_percentage > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {vendor.overdue_percentage}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("vendors.performance.business")}:</div>
                    <div className={`font-medium ${vendor.business_percentage > 10 ? 'text-blue-600 font-semibold' : ''}`}>
                      {vendor.business_percentage}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("vendors.performance.pay_rate")}:</div>
                    <div className={`font-medium ${vendor.payment_success_rate > 95 ? 'text-green-600' : vendor.payment_success_rate > 85 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {vendor.payment_success_rate}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("vendors.performance.outstanding")}:</div>
                    <div className="font-medium text-red-600 break-all">
                      {vendor.outstanding_amount ? `SAR ${Math.round(vendor.outstanding_amount).toLocaleString()}` : t('common.n_a')}
                    </div>
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
                <TableHead className="text-center">{t("vendors.performance.score")}</TableHead>
                <TableHead className="text-right">{t("vendors.performance.bills")}</TableHead>
                <TableHead className="text-right">{t("vendors.performance.pay_days")}</TableHead>
                <TableHead className="text-right">{t("vendors.performance.overdue")} %</TableHead>
                <TableHead className="text-right">{t("vendors.performance.business")} %</TableHead>
                <TableHead className="text-right">{t("vendors.performance.pay_rate")}</TableHead>
                <TableHead className="text-right">{t("vendors.performance.outstanding")}</TableHead>
                <TableHead className="text-center">{t("vendors.performance.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((vendor, index) => (
                <TableRow key={vendor.vendor_id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold text-sm">
                        {vendor.vendor_name}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {t('common.id')}: {vendor.vendor_id.slice(-8)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(vendor.performance_score)}`}>
                      {vendor.performance_score}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {vendor.total_bills}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={vendor.avg_payment_days > 60 ? 'text-red-600' : vendor.avg_payment_days > 30 ? 'text-yellow-600' : 'text-green-600'}>
                      {vendor.avg_payment_days}d
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {vendor.payment_reliability_score ? `${vendor.payment_reliability_score}/100` : t('common.n_a')}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={vendor.overdue_percentage > 15 ? 'text-red-600' : vendor.overdue_percentage > 10 ? 'text-yellow-600' : 'text-green-600'}>
                      {vendor.overdue_percentage}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={vendor.business_percentage > 10 ? 'text-blue-600 font-semibold' : ''}>
                      {vendor.business_percentage}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={vendor.payment_success_rate > 95 ? 'text-green-600' : vendor.payment_success_rate > 85 ? 'text-yellow-600' : 'text-red-600'}>
                      {vendor.payment_success_rate}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-medium text-red-600">
                      {vendor.outstanding_amount ? `SAR ${Math.round(vendor.outstanding_amount).toLocaleString()}` : t('common.n_a')}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getScoreBadgeVariant(vendor.vendor_status)} className="text-xs">
                      {vendor.vendor_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Enhanced Summary Statistics with Payment Intelligence */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">
              {data.filter(v => v.vendor_status.includes('Excellent')).length}
            </div>
            <div className="text-xs text-muted-foreground">Excellent Vendors</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">
              {data.reduce((sum, v) => sum + v.business_percentage, 0).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Total Business Share</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">
              {(data.reduce((sum, v) => sum + v.avg_payment_days, 0) / data.length).toFixed(1)}d
            </div>
            <div className="text-xs text-muted-foreground">Avg Payment Days (Actual)</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">
              {(data.reduce((sum, v) => sum + v.payment_success_rate, 0) / data.length).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Payment Rate</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-red-600">
              SAR {Math.round(data.reduce((sum, v) => sum + (v.outstanding_amount || 0), 0)).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total Outstanding</div>
          </div>
        </div>

        {/* Payment Intelligence Insights */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h5 className="text-sm font-medium mb-2 flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Target className="h-4 w-4" />
            Payment Intelligence Insights
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
            <div>
              <strong>Fast Payers:</strong> {data.filter(v => v.avg_payment_days <= 30).length} vendors pay within 30 days
            </div>
            <div>
              <strong>High Reliability:</strong> {data.filter(v => (v.payment_reliability_score || 0) >= 80).length} vendors with 80+ reliability score
            </div>
            <div>
              <strong>Complete Payers:</strong> {data.filter(v => v.payment_success_rate >= 95).length} vendors with 95%+ payment completion
            </div>
            <div>
              <strong>Risk Concentration:</strong> {data.filter(v => v.business_percentage > 10).length} vendors represent {">10% of business each"}
            </div>
          </div>
        </div>

        {/* Enhanced Performance Legend */}
        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>90+ Excellent Performance</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>75-89 Good Performance</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>60-74 Average Performance</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>{"<60 Needs Attention"}</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <strong>Performance Score:</strong> Based on payment reliability, completion rate, speed, and overdue percentage. 
            <strong>Pay Days:</strong> Actual days from bill to payment. 
            <strong>Pay Rate:</strong> Percentage of billed amount actually paid.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}