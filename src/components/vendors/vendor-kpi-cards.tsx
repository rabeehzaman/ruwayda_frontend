"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useVendorKPIs } from "@/hooks/use-vendor-kpis"
import { useLocale } from "@/i18n/locale-provider"
import {
  FileText,
  Clock,
  AlertTriangle,
  Users,
  CheckCircle
} from "lucide-react"
import { formatCurrency as formatCurrencySAR } from '@/lib/formatting'

const formatCurrency = (amount: number) => {
  return formatCurrencySAR(amount)
}

const formatPercentage = (percentage: number) => `${percentage.toFixed(1)}%`

interface KPICardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: {
    text: string
    variant: "default" | "secondary" | "destructive" | "outline"
  }
  loading?: boolean
  color?: string
}

function KPICard({ title, value, subtitle, icon: Icon, badge, loading, color = '#3B82F6' }: KPICardProps) {
  if (loading) {
    return (
      <Card className="border-l-4" style={{ borderLeftColor: color }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-24" />
          </CardTitle>
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-24" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-l-4 hover:shadow-md transition-shadow w-full max-w-full" style={{ borderLeftColor: color }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium truncate">{title}</CardTitle>
        <div style={{ color }} className="flex-shrink-0">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="w-full max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between">
          <div className="text-xl sm:text-2xl font-bold break-all" style={{ color }}>{value}</div>
          {badge && (
            <Badge variant={badge.variant} className="ml-2">
              {badge.text}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface VendorKPICardsProps {
  className?: string
  locationIds?: string[]
}

export function VendorKPICards({ className, locationIds }: VendorKPICardsProps) {
  const { t } = useLocale()
  const { data, loading, error } = useVendorKPIs(locationIds)

  if (error) {
    return (
      <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 w-full max-w-full overflow-x-hidden ${className || ''}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="border-red-200">
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">{t("vendors.messages.failed_to_load_kpis")}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 w-full max-w-full overflow-x-hidden ${className || ''}`}>
      {/* Outstanding Bills */}
      <KPICard
        title={t("vendors.kpi.outstanding_bills")}
        value={data ? data.outstanding_bills.toString() : "Loading..."}
        subtitle={data ? `${t("vendors.kpi.open")}: ${data.open_bills} | ${t("vendors.kpi.overdue")}: ${data.overdue_bills}` : undefined}
        icon={FileText}
        badge={data && data.overdue_bills > 0 ? {
          text: data.overdue_bills > 100 ? t("vendors.status_badges.high_risk") : t("vendors.status_badges.monitor"),
          variant: data.overdue_bills > 100 ? "destructive" : "outline"
        } : undefined}
        loading={loading}
        color="#EF4444"
      />

      {/* Average Payment Days */}
      <KPICard
        title={t("vendors.kpi.avg_payment_days")}
        value={data ? `${data.avg_payment_days.toFixed(1)}` : "Loading..."}
        subtitle={t("vendors.kpi.days_to_payment")}
        icon={Clock}
        badge={data ? {
          text: data.avg_payment_days > 200 ? t("vendors.status_badges.slow") : data.avg_payment_days > 150 ? t("vendors.status_badges.average") : t("vendors.status_badges.good"),
          variant: data.avg_payment_days > 200 ? "destructive" : data.avg_payment_days > 150 ? "outline" : "default"
        } : undefined}
        loading={loading}
        color="#3B82F6"
      />

      {/* Overdue Rate */}
      <KPICard
        title={t("vendors.kpi.overdue_rate")}
        value={data ? formatPercentage(data.overdue_percentage) : "Loading..."}
        subtitle={data ? `${data.overdue_bills} of ${data.total_bills} ${t("vendors.performance.bills").toLowerCase()}` : undefined}
        icon={AlertTriangle}
        badge={data ? {
          text: data.overdue_percentage > 15 ? t("vendors.status_badges.critical") : data.overdue_percentage > 10 ? t("vendors.status_badges.warning") : t("vendors.status_badges.good"),
          variant: data.overdue_percentage > 15 ? "destructive" : data.overdue_percentage > 10 ? "outline" : "default"
        } : undefined}
        loading={loading}
        color="#F59E0B"
      />

      {/* Active Vendors */}
      <KPICard
        title={t("vendors.kpi.active_vendors")}
        value={data ? data.active_vendors_this_month.toString() : "Loading..."}
        subtitle={t("vendors.kpi.this_month")}
        icon={Users}
        badge={data ? {
          text: data.active_vendors_this_month > 40 ? t("vendors.status_badges.high_activity") : t("vendors.status_badges.normal"),
          variant: "secondary"
        } : undefined}
        loading={loading}
        color="#10B981"
      />

      {/* Payment Success Rate */}
      <KPICard
        title={t("vendors.kpi.payment_success")}
        value={data ? formatPercentage(data.payment_success_rate) : "Loading..."}
        subtitle={data ? `${data.paid_bills} paid ${t("vendors.performance.bills").toLowerCase()}` : undefined}
        icon={CheckCircle}
        badge={data ? {
          text: data.payment_success_rate > 90 ? t("vendors.status_badges.excellent") : data.payment_success_rate > 80 ? t("vendors.status_badges.good") : t("vendors.status_badges.needs_work"),
          variant: data.payment_success_rate > 90 ? "default" : data.payment_success_rate > 80 ? "secondary" : "destructive"
        } : undefined}
        loading={loading}
        color="#8B5CF6"
      />
    </div>
  )
}