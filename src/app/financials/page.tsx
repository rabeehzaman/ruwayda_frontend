"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DateFilter, type DateRange } from "@/components/dashboard/date-filter"
import { startOfMonth, endOfDay } from "date-fns"
import { StatementOfProfitAndLoss } from "@/components/financials/statement-of-profit-and-loss"
import { BalanceSheet } from "@/components/financials/balance-sheet"
import { useLocale } from "@/i18n/locale-provider"

export default function FinancialsPage() {
  const { t } = useLocale()
  const [dateRange, setDateRange] = React.useState<DateRange>(() => {
    const now = new Date()
    return {
      from: startOfMonth(now),
      to: endOfDay(now)
    }
  })

  return (
    <DashboardLayout>
      {/* Header and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full max-w-full">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{t("financials.title")}</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto max-w-full overflow-x-hidden">
          <DateFilter
            onDateRangeChange={setDateRange}
            className="w-full sm:w-auto min-h-[44px]"
          />
        </div>
      </div>

      {/* Statement of Profit and Loss */}
      <StatementOfProfitAndLoss dateRange={dateRange} locationIds={null} />

      {/* Balance Sheet */}
      <BalanceSheet dateRange={dateRange} />
    </DashboardLayout>
  )
}
