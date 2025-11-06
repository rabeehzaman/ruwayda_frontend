"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, DollarSign, Percent, ShoppingCart, Receipt, Package, Warehouse, Calendar, Eye, Target, ReceiptText } from "lucide-react"
import { useOptimizedKPIs } from "@/hooks/use-optimized-data"
import { formatCurrency, formatNumber } from "@/lib/formatting"
import { useLocale } from "@/i18n/locale-provider"
import { cssAnimations, createStaggeredClasses } from "@/lib/css-animations"
import type { DateRange } from "@/components/dashboard/date-filter"

interface KPICardProps {
  title: string
  value: string
  change?: number
  description?: string
  icon?: React.ReactNode
  loading?: boolean
  delay?: number
}

function KPICard({ title, value, change, description, icon, loading, delay = 0 }: KPICardProps) {
  if (loading) {
    return (
      <Card animated={false}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    )
  }

  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <Card hoverable={true} delay={delay}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm sm:text-base font-semibold">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs">
            {isPositive && (
              <>
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <Badge variant="secondary" className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400">
                  +{change.toFixed(1)}%
                </Badge>
              </>
            )}
            {isNegative && (
              <>
                <TrendingDown className="h-3 w-3 text-red-500" />
                <Badge variant="secondary" className="text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400">
                  {change.toFixed(1)}%
                </Badge>
              </>
            )}
            {change === 0 && (
              <Badge variant="secondary" className="text-muted-foreground">
                0%
              </Badge>
            )}
            {description && <span className="text-muted-foreground ml-1">{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface KPICardsProps {
  dateRange?: DateRange
  locationIds?: string[]
  kpis: any // Required: must be provided by parent
  loading: boolean // Required: must be provided by parent
  error: string | null // Required: must be provided by parent
}

export function KPICards({ dateRange, locationIds, kpis, loading, error }: KPICardsProps) {
  const { t } = useLocale()

  if (error) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 px-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">{t("messages.error")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t("messages.failed_to_load")}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!kpis && !loading) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 px-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="text-yellow-600 dark:text-yellow-400">{t("messages.no_data")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t("messages.no_data_available")}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Performance indicator */}
      {!loading && kpis && (
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>{t("kpi.database_optimized")}</span>
            <span className="ml-2">
              ({kpis.uniqueInvoices || kpis.totalInvoices || 0} {t("kpi.invoices")}, {kpis.totalQuantity || 0} {t("kpi.items")})
            </span>
          </div>
        </div>
      )}
      
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 px-1">
        <KPICard
          title={t("kpi.total_revenue")}
          value={formatCurrency(kpis?.totalRevenue || 0)}
          icon={<DollarSign className="h-4 w-4" />}
          loading={loading}
          delay={0}
        />
        <KPICard
          title={t("kpi.taxable_sales")}
          value={formatCurrency(kpis?.totalTaxableSales || 0)}
          icon={<Receipt className="h-4 w-4" />}
          loading={loading}
          delay={100}
        />
        <KPICard
          title={t("kpi.gross_profit")}
          value={formatCurrency(kpis?.grossProfit || 0)}
          icon={<TrendingUp className="h-4 w-4" />}
          loading={loading}
          delay={200}
        />
        <KPICard
          title={t("kpi.gp_percentage")}
          value={`${(kpis?.grossProfitMargin || 0).toFixed(1)}%`}
          icon={<Percent className="h-4 w-4" />}
          loading={loading}
          delay={300}
        />
      </div>
    </div>
  )
}

export function ExtendedKPICards({ dateRange, locationIds, kpis, loading, error }: KPICardsProps) {
  const { t } = useLocale()

  if (error) {
    return (
      <div className="text-red-600 dark:text-red-400 text-center py-4">
        {t("messages.failed_to_load_kpi")}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* First row - Extended KPIs */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 px-1">
        <KPICard
          title={t("kpi.total_expenses")}
          value={formatCurrency(kpis?.totalExpenses || 0)}
          icon={<Receipt className="h-4 w-4" />}
          loading={loading}
        />
        <KPICard
          title={t("kpi.net_profit")}
          value={formatCurrency(kpis?.netProfit || 0)}
          icon={<Target className="h-4 w-4" />}
          loading={loading}
        />
        <KPICard
          title={t("kpi.total_stock_value")}
          value={formatCurrency(kpis?.totalStockValue || 0)}
          icon={<Warehouse className="h-4 w-4" />}
          loading={loading}
        />
        <KPICard
          title={t("kpi.daily_avg_sales")}
          value={formatCurrency(kpis?.dailyAvgSales || 0)}
          icon={<Calendar className="h-4 w-4" />}
          loading={loading}
        />
      </div>

      {/* Second row - Additional metrics */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-1 lg:grid-cols-2 px-1">
        <KPICard
          title={`${t("nav.overview")} (${t("kpi.invoices")})`}
          value={formatNumber(kpis?.uniqueInvoices || kpis?.totalInvoices || 0)}
          icon={<Eye className="h-4 w-4" />}
          loading={loading}
        />
        <KPICard
          title={kpis?.netVatPayable >= 0 ? t("kpi.net_vat_payable") : t("kpi.net_vat_refundable")}
          value={formatCurrency(Math.abs(kpis?.netVatPayable || 0))}
          icon={<ReceiptText className="h-4 w-4" />}
          loading={loading}
        />
      </div>
    </div>
  )
}