"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useRiskCategoryDistribution } from "@/hooks/use-customer-aging-kpis"
import { useLocale } from "@/i18n/locale-provider"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { AlertTriangle, PieChart as PieChartIcon } from "lucide-react"
import { formatCurrency as formatCurrencySAR } from '@/lib/formatting'

const formatCurrency = (amount: string) => {
  return formatCurrencySAR(parseFloat(amount))
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: {
      risk_category: string
      customer_count: number
      total_amount: string
      chart_color: string
    }
  }>
  t: (key: string) => string
}

function CustomTooltip({ active, payload, t }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium">{data.risk_category}</p>
        <p className="text-sm text-muted-foreground">
          {data.customer_count} {t('customers.table_headers.customers')}
        </p>
        <p className="text-sm font-medium">
          {formatCurrency(data.total_amount)}
        </p>
      </div>
    )
  }
  return null
}

function RiskLegend({ data }: { data: Array<{ risk_category: string; customer_count: number; total_amount: string; chart_color: string }> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
      {data.map((entry, index) => (
        <div key={index} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: entry.chart_color }}
            />
            <span className="truncate">{entry.risk_category}</span>
          </div>
          <div className="text-right ml-2 flex-shrink-0">
            <div className="font-medium">{entry.customer_count}</div>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(entry.total_amount)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface RiskDistributionChartProps {
  selectedOwners?: string[]
}

export function RiskDistributionChart({ selectedOwners }: RiskDistributionChartProps) {
  const { t } = useLocale()
  const { data, loading, error } = useRiskCategoryDistribution(selectedOwners)

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">{t("customers.charts.error_loading_chart")}</CardTitle>
          <CardDescription>{t("customers.charts.failed_to_load_risk")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
{t("customers.charts.risk_distribution")}
          </CardTitle>
          <CardDescription>{t("pages.customers.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Skeleton className="w-48 h-48 rounded-full mx-auto mb-4" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 mt-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-3 h-3 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
{t("customers.charts.risk_distribution")}
          </CardTitle>
          <CardDescription>{t("pages.customers.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <PieChartIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">{t("common.no_data_available")}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Prepare chart data
  const chartData = data.map(item => ({
    ...item,
    value: parseFloat(item.total_amount)
  }))

  const totalAmount = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          {t("customers.charts.risk_distribution")}
        </CardTitle>
        <CardDescription>
          {t("pages.customers.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.chart_color}
                      stroke={entry.chart_color}
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip t={t} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Center text showing total */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-sm sm:text-lg font-bold">
                {formatCurrency(totalAmount.toString())}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("pages.vendors.total_outstanding")}
              </div>
            </div>
          </div>
        </div>

        {/* Custom Legend */}
        <RiskLegend data={chartData} />

        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t("customers.charts.total_customers_label")}</span>
              <span className="ml-2 font-medium">
                {data.reduce((sum, item) => sum + item.customer_count, 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("customers.charts.high_risk_label")}</span>
              <span className="ml-2 font-medium text-red-600">
                {data.filter(item => item.risk_level === 'High' || item.risk_level === 'Very High')
                     .reduce((sum, item) => sum + item.customer_count, 0)} {t("customers.table_headers.customers")}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}