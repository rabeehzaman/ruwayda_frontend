"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useCustomerAgingSummaryKPIs } from "@/hooks/use-customer-aging-kpis"
import { useLocale } from "@/i18n/locale-provider"
import {
  DollarSign,
  Users,
  Clock,
  AlertTriangle
} from "lucide-react"
import { formatCurrency as formatCurrencySAR } from '@/lib/formatting'

const formatCurrency = (amount: string) => {
  return formatCurrencySAR(parseFloat(amount))
}

const formatPercentage = (percentage: string) => `${percentage}%`

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
}

function KPICard({ title, value, subtitle, icon: Icon, badge, loading }: KPICardProps) {
  if (loading) {
    return (
      <Card className="border-l-4 border-l-primary">
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
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
        <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-lg sm:text-2xl font-bold text-primary">{value}</div>
          {badge && (
            <Badge variant={badge.variant} className="text-xs self-start sm:self-auto">
              {badge.text}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface CustomerAgingKPICardsProps {
  selectedOwners?: string[]
}

export function CustomerAgingKPICards({ selectedOwners }: CustomerAgingKPICardsProps) {
  const { t } = useLocale()
  const { data, loading, error } = useCustomerAgingSummaryKPIs(selectedOwners)

  if (error) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-red-200">
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">{t("customers.messages.failed_to_load_kpis")}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Receivables */}
      <KPICard
        title={t("customers.kpi.total_receivables")}
        value={data ? formatCurrency(data.total_receivables) : t("common.loading")}
        subtitle={data ? `${data.total_customers_with_balance} ${t("customers.kpi.customers_with_balance")}` : undefined}
        icon={DollarSign}
        badge={data ? {
          text: `${data.total_outstanding_invoices} ${t("customers.table_headers.invoices")}`,
          variant: "secondary"
        } : undefined}
        loading={loading}
      />

      {/* Current (0-30 days) */}
      <KPICard
        title={t("customers.kpi.current_0_30_days")}
        value={data ? formatPercentage(data.current_percentage) : t("common.loading")}
        subtitle={data ? `${formatCurrency(data.current_amount)} ${t("customers.kpi.from_customers")} ${data.current_customers_count}` : undefined}
        icon={Users}
        badge={data ? {
          text: t("customers.status_badges.good"),
          variant: "default"
        } : undefined}
        loading={loading}
      />

      {/* Past Due (31-180 days) */}
      <KPICard
        title={t("customers.kpi.past_due_31_180_days")}
        value={data ? formatPercentage(
          (parseFloat(data.past_due_31_60_percentage) + 
           parseFloat(data.past_due_61_90_percentage) + 
           parseFloat(data.past_due_91_180_percentage)).toFixed(2)
        ) : t("common.loading")}
        subtitle={data ? `${
          data.past_due_31_60_count + 
          data.past_due_61_90_count + 
          data.past_due_91_180_count
        } ${t("customers.kpi.customers_need_attention")}` : undefined}
        icon={Clock}
        badge={data ? {
          text: t("customers.status_badges.watch"),
          variant: "outline"
        } : undefined}
        loading={loading}
      />

      {/* High Risk (180+ days) */}
      <KPICard
        title={t("customers.kpi.high_risk_180_days")}
        value={data ? formatPercentage(data.over_180_percentage) : t("common.loading")}
        subtitle={data ? `${formatCurrency(data.over_180_amount)} ${t("customers.kpi.from_customers")} ${data.over_180_count}` : undefined}
        icon={AlertTriangle}
        badge={data ? {
          text: t("customers.status_badges.critical"),
          variant: "destructive"
        } : undefined}
        loading={loading}
      />
    </div>
  )
}