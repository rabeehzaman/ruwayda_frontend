"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, subMonths, isSameMonth, startOfDay, endOfDay } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type MonthBadgeRange = {
  from: Date
  to: Date
}

export type MonthBadgeRangeString = {
  from: string
  to: string
}

interface MonthBadgesProps {
  onMonthSelect: (range: MonthBadgeRange) => void
  selectedRange?: MonthBadgeRange
  monthCount?: number
  className?: string
}

interface MonthBadgesStringProps {
  onMonthSelect: (range: MonthBadgeRangeString) => void
  selectedRange?: MonthBadgeRangeString
  monthCount?: number
  className?: string
}

function getLastMonths(count: number = 6): Date[] {
  const months: Date[] = []
  const today = new Date()

  for (let i = 0; i < count; i++) {
    months.push(subMonths(today, i))
  }

  return months.reverse()
}

function isMonthSelected(month: Date, selectedRange?: MonthBadgeRange): boolean {
  if (!selectedRange) return false

  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)

  // Check if the selected range matches this month (either full month or current month-to-date)
  return (
    isSameMonth(selectedRange.from, month) &&
    (isSameMonth(selectedRange.to, month) ||
     (selectedRange.to >= monthStart && selectedRange.to <= monthEnd))
  )
}

function isMonthSelectedString(month: Date, selectedRange?: MonthBadgeRangeString): boolean {
  if (!selectedRange) return false

  const selectedFrom = new Date(selectedRange.from)
  const selectedTo = new Date(selectedRange.to)

  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)

  return (
    isSameMonth(selectedFrom, month) &&
    (isSameMonth(selectedTo, month) ||
     (selectedTo >= monthStart && selectedTo <= monthEnd))
  )
}

export function MonthBadges({
  onMonthSelect,
  selectedRange,
  monthCount = 6,
  className
}: MonthBadgesProps) {
  const months = React.useMemo(() => getLastMonths(monthCount), [monthCount])

  const handleMonthClick = (month: Date) => {
    const today = new Date()
    const isCurrentMonth = isSameMonth(month, today)

    const range: MonthBadgeRange = {
      from: startOfMonth(month),
      // For current month, use today; for past months, use end of month
      to: isCurrentMonth ? endOfDay(today) : endOfMonth(month)
    }

    onMonthSelect(range)
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm text-muted-foreground hidden sm:inline">Quick select:</span>
      {months.map((month) => {
        const isSelected = isMonthSelected(month, selectedRange)
        const isCurrentMonth = isSameMonth(month, new Date())

        return (
          <Button
            key={month.toISOString()}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => handleMonthClick(month)}
            className={cn(
              "h-8 px-3 text-xs font-medium transition-all",
              isSelected && "ring-2 ring-primary ring-offset-2",
              !isSelected && "hover:border-primary hover:text-primary"
            )}
          >
            {format(month, "MMM yyyy")}
            {isCurrentMonth && (
              <span className="ml-1 text-[10px] opacity-70">(MTD)</span>
            )}
          </Button>
        )
      })}
    </div>
  )
}

export function MonthBadgesString({
  onMonthSelect,
  selectedRange,
  monthCount = 6,
  className
}: MonthBadgesStringProps) {
  const months = React.useMemo(() => getLastMonths(monthCount), [monthCount])

  const handleMonthClick = (month: Date) => {
    const today = new Date()
    const isCurrentMonth = isSameMonth(month, today)

    const range: MonthBadgeRangeString = {
      from: format(startOfMonth(month), "yyyy-MM-dd"),
      // For current month, use today; for past months, use end of month
      to: isCurrentMonth
        ? format(today, "yyyy-MM-dd")
        : format(endOfMonth(month), "yyyy-MM-dd")
    }

    onMonthSelect(range)
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm text-muted-foreground hidden sm:inline">Quick select:</span>
      {months.map((month) => {
        const isSelected = isMonthSelectedString(month, selectedRange)
        const isCurrentMonth = isSameMonth(month, new Date())

        return (
          <Button
            key={month.toISOString()}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => handleMonthClick(month)}
            className={cn(
              "h-8 px-3 text-xs font-medium transition-all",
              isSelected && "ring-2 ring-primary ring-offset-2",
              !isSelected && "hover:border-primary hover:text-primary"
            )}
          >
            {format(month, "MMM yyyy")}
            {isCurrentMonth && (
              <span className="ml-1 text-[10px] opacity-70">(MTD)</span>
            )}
          </Button>
        )
      })}
    </div>
  )
}
