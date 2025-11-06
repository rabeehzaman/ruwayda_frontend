"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from "date-fns"

import { cn } from "@/lib/utils"
import { useLocale } from "@/i18n/locale-provider"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type DateRange = {
  from: Date
  to: Date
}

export type DateFilterPreset = 
  | "today"
  | "yesterday"
  | "day-before-yesterday"
  | "this-week"
  | "last-week"
  | "this-month"
  | "previous-month"
  | "this-year"
  | "previous-year"
  | "custom"

interface DateFilterProps {
  onDateRangeChange: (dateRange: DateRange) => void
  className?: string
}


function getDateRangeFromPreset(preset: DateFilterPreset): DateRange | null {
  const today = new Date()
  
  switch (preset) {
    case "today":
      return {
        from: startOfDay(today),
        to: endOfDay(today)
      }
    case "yesterday":
      const yesterday = subDays(today, 1)
      return {
        from: startOfDay(yesterday),
        to: endOfDay(yesterday)
      }
    case "day-before-yesterday":
      const dayBeforeYesterday = subDays(today, 2)
      return {
        from: startOfDay(dayBeforeYesterday),
        to: endOfDay(dayBeforeYesterday)
      }
    case "this-week":
      return {
        from: startOfWeek(today, { weekStartsOn: 1 }), // Monday
        to: endOfWeek(today, { weekStartsOn: 1 })
      }
    case "last-week":
      const lastWeek = subWeeks(today, 1)
      return {
        from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
        to: endOfWeek(lastWeek, { weekStartsOn: 1 })
      }
    case "this-month":
      return {
        from: startOfMonth(today),
        to: endOfDay(today) // Changed from endOfMonth to current date for "month to date"
      }
    case "previous-month":
      const previousMonth = subMonths(today, 1)
      return {
        from: startOfMonth(previousMonth),
        to: endOfMonth(previousMonth)
      }
    case "this-year":
      return {
        from: startOfYear(today),
        to: endOfYear(today)
      }
    case "previous-year":
      const previousYear = subYears(today, 1)
      return {
        from: startOfYear(previousYear),
        to: endOfYear(previousYear)
      }
    default:
      return null
  }
}

export function DateFilter({ onDateRangeChange, className }: DateFilterProps) {
  const { t } = useLocale()
  const [selectedPreset, setSelectedPreset] = React.useState<DateFilterPreset>("this-month")
  const [customDateRange, setCustomDateRange] = React.useState<DateRange | undefined>()
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)
  
  const datePresets: Array<{ value: DateFilterPreset; label: string }> = [
    { value: "today", label: t("filters.date_presets.today") },
    { value: "yesterday", label: t("filters.date_presets.yesterday") },
    { value: "day-before-yesterday", label: t("filters.date_presets.day_before_yesterday") },
    { value: "this-week", label: t("filters.date_presets.this_week") },
    { value: "last-week", label: t("filters.date_presets.last_week") },
    { value: "this-month", label: t("filters.date_presets.this_month") },
    { value: "previous-month", label: t("filters.date_presets.previous_month") },
    { value: "this-year", label: t("filters.date_presets.this_year") },
    { value: "previous-year", label: t("filters.date_presets.previous_year") },
    { value: "custom", label: t("filters.date_presets.custom_range") },
  ]

  React.useEffect(() => {
    if (selectedPreset === "custom" && customDateRange) {
      onDateRangeChange(customDateRange)
    } else if (selectedPreset !== "custom") {
      const dateRange = getDateRangeFromPreset(selectedPreset)
      if (dateRange) {
        onDateRangeChange(dateRange)
      }
    }
  }, [selectedPreset, customDateRange, onDateRangeChange])

  const handlePresetChange = (preset: DateFilterPreset) => {
    setSelectedPreset(preset)
    if (preset !== "custom") {
      setCustomDateRange(undefined)
    }
  }

  const handleCustomDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      const dateRange: DateRange = {
        from: startOfDay(range.from),
        to: endOfDay(range.to)
      }
      setCustomDateRange(dateRange)
      setIsCalendarOpen(false)
    }
  }

  const getDisplayText = () => {
    if (selectedPreset === "custom" && customDateRange) {
      return `${format(customDateRange.from, "MMM d, yyyy")} - ${format(customDateRange.to, "MMM d, yyyy")}`
    }

    const preset = datePresets.find(p => p.value === selectedPreset)
    return preset?.label || "Select date range"
  }

  const getMobileDisplayText = () => {
    if (selectedPreset === "custom" && customDateRange) {
      return `${format(customDateRange.from, "MMM d")} - ${format(customDateRange.to, "MMM d")}`
    }

    // Shorter labels for mobile
    const mobileLabels: Record<DateFilterPreset, string> = {
      "today": "Today",
      "yesterday": "Yesterday",
      "day-before-yesterday": "2 Days Ago",
      "this-week": "This Week",
      "last-week": "Last Week",
      "this-month": "This Month",
      "previous-month": "Last Month",
      "this-year": "This Year",
      "previous-year": "Last Year",
      "custom": "Custom"
    }

    return mobileLabels[selectedPreset] || getDisplayText()
  }

  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center gap-2", className)}>
      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-full sm:w-[180px] min-h-[44px] hover:border-primary focus:ring-primary focus:border-primary">
          <CalendarIcon className="h-4 w-4 mr-2 shrink-0" />
          <span className="truncate block sm:hidden">{getMobileDisplayText()}</span>
          <span className="truncate hidden sm:block">{getDisplayText()}</span>
        </SelectTrigger>
        <SelectContent>
          {datePresets.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedPreset === "custom" && (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-[280px] min-h-[44px] justify-start text-left font-normal",
                !customDateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customDateRange ? (
                `${format(customDateRange.from, "MMM d, yyyy")} - ${format(customDateRange.to, "MMM d, yyyy")}`
              ) : (
                t("filters.date_range")
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={customDateRange?.from}
              selected={customDateRange ? { from: customDateRange.from, to: customDateRange.to } : undefined}
              onSelect={handleCustomDateSelect}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>
      )}

      <div className="hidden sm:block text-sm text-muted-foreground">
        {getDisplayText()}
      </div>
    </div>
  )
}