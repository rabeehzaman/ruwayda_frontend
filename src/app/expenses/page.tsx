"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ExpensesTable } from "@/components/expenses/expenses-table"
import { DateFilter, type DateRange } from "@/components/dashboard/date-filter"
import { startOfMonth, endOfDay } from "date-fns"
import { useLocale } from "@/i18n/locale-provider"

export default function ExpensesPage() {
  const { t, isArabic } = useLocale()
  const [dateRange, setDateRange] = React.useState<DateRange>(() => {
    const now = new Date()
    return {
      from: startOfMonth(now),
      to: endOfDay(now) // Month to date
    }
  })

  return (
    <DashboardLayout>
      {/* Filters */}
      <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full max-w-full overflow-x-hidden ${isArabic ? 'sm:flex-row-reverse' : ''}`}>
        <div>
          <h2 className={`text-xl sm:text-2xl font-bold tracking-tight truncate ${isArabic ? 'text-right' : ''}`}>{t("pages.expenses.title")}</h2>
          <p className={`text-sm sm:text-base text-muted-foreground ${isArabic ? 'text-right' : ''}`}>
            {t("pages.expenses.description")}
          </p>
        </div>
        <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto max-w-full overflow-x-hidden ${isArabic ? 'sm:flex-row-reverse' : ''}`}>
          <DateFilter
            onDateRangeChange={setDateRange}
            className="w-full sm:w-auto min-h-[44px]"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div>
        <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${isArabic ? 'text-right' : ''}`}>{t("pages.expenses.all_expenses")}</h3>
        <ExpensesTable locationIds={null} dateRange={dateRange} />
      </div>
    </DashboardLayout>
  )
}