"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { startOfMonth, endOfMonth } from "date-fns"

import { cn } from "@/lib/utils"
import { useLocale } from "@/i18n/locale-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useVATAvailableMonths } from "@/hooks/use-vat-available-months"

export type DateRange = {
  from: Date
  to: Date
}

interface MonthFilterProps {
  onDateRangeChange: (dateRange: DateRange) => void
  className?: string
}

export function MonthFilter({ onDateRangeChange, className }: MonthFilterProps) {
  const { t } = useLocale()
  const { months, loading, error } = useVATAvailableMonths()
  const [selectedMonth, setSelectedMonth] = React.useState<string>("")

  // Month names array for translation
  const monthNames = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ]

  // Set default month when months are loaded
  React.useEffect(() => {
    if (months.length > 0 && !selectedMonth) {
      const currentMonth = new Date().getMonth() + 1 // 1-based month
      const currentYear = new Date().getFullYear()

      // Check if current month has transactions
      const currentMonthData = months.find(m => m.month === currentMonth && m.year === currentYear)

      if (currentMonthData) {
        // Use current month if it has transactions
        setSelectedMonth(`${currentYear}-${currentMonth}`)
      } else {
        // Otherwise use the most recent month
        const mostRecent = months[months.length - 1]
        setSelectedMonth(`${mostRecent.year}-${mostRecent.month}`)
      }
    }
  }, [months, selectedMonth])

  // Trigger date range change when selected month changes
  React.useEffect(() => {
    if (selectedMonth) {
      const [year, month] = selectedMonth.split("-").map(Number)
      const dateRange: DateRange = {
        from: startOfMonth(new Date(year, month - 1)),
        to: endOfMonth(new Date(year, month - 1))
      }
      onDateRangeChange(dateRange)
    }
  }, [selectedMonth, onDateRangeChange])

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Select disabled>
          <SelectTrigger className="w-full sm:w-[280px] min-h-[44px]">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("common.loading")} />
          </SelectTrigger>
        </Select>
      </div>
    )
  }

  if (error || months.length === 0) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Select disabled>
          <SelectTrigger className="w-full sm:w-[280px] min-h-[44px]">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("filters.no_months_available")} />
          </SelectTrigger>
        </Select>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
        <SelectTrigger className="w-full sm:w-[280px] min-h-[44px] hover:border-primary focus:ring-primary focus:border-primary">
          <CalendarIcon className="h-4 w-4 mr-2" />
          <SelectValue placeholder={t("filters.select_month")} />
        </SelectTrigger>
        <SelectContent>
          {months.map((monthData) => {
            const monthKey = monthNames[monthData.month - 1]
            const monthLabel = t(`filters.months.${monthKey}`)
            const displayText = `${monthLabel} ${monthData.year} (${monthData.transaction_count} ${t("filters.transactions")})`
            const value = `${monthData.year}-${monthData.month}`

            return (
              <SelectItem key={value} value={value}>
                {displayText}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
