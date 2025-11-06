"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { KPICards, ExtendedKPICards } from "@/components/dashboard/kpi-cards"
import { OptimizedTabbedTables } from "@/components/dashboard/optimized-tabbed-tables"
import { DateFilter, type DateRange } from "@/components/dashboard/date-filter"
import { useOptimizedKPIs } from "@/hooks/use-optimized-data"
import { startOfMonth, endOfDay } from "date-fns"
import { useLocale } from "@/i18n/locale-provider"

export default function Home() {
  const { t, isArabic } = useLocale()
  const [dateRange, setDateRange] = React.useState<DateRange>(() => {
    const now = new Date()
    return {
      from: startOfMonth(now),
      to: endOfDay(now) // Month to date, not full month
    }
  })

  // Call useOptimizedKPIs once at parent level to prevent race condition
  // Both KPICards and ExtendedKPICards will receive this data as props
  const { kpis, loading, error } = useOptimizedKPIs(dateRange, null)

  // Debug: Log what we're passing to KPI cards
  console.log('🔍 Parent component - passing to KPI cards:', { kpis, loading, error })

  return (
    <DashboardLayout>
      {/* Filters */}
      <div className={`filter-controls flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full max-w-full overflow-x-hidden ${isArabic ? 'sm:flex-row-reverse' : ''}`}>
        <h2 className={`text-xl sm:text-2xl font-bold tracking-tight truncate ${isArabic ? 'text-right' : ''}`}>{t("dashboard.overview")}</h2>
        <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto max-w-full overflow-x-hidden ${isArabic ? 'sm:flex-row-reverse' : ''}`}>
          <DateFilter
            onDateRangeChange={setDateRange}
            className="w-full sm:w-auto min-h-[44px]"
          />
        </div>
      </div>

      {/* Main KPI Cards */}
      <KPICards dateRange={dateRange} locationIds={null} kpis={kpis} loading={loading} error={error} />

      {/* Extended KPIs */}
      <ExtendedKPICards dateRange={dateRange} locationIds={null} kpis={kpis} loading={loading} error={error} />

      {/* Optimized Tabbed Data Tables */}
      <div className="table-container">
        <OptimizedTabbedTables dateRange={dateRange} locationIds={null} />
      </div>
    </DashboardLayout>
  )
}
