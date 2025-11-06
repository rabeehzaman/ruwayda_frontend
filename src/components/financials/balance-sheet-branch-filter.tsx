"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface BalanceSheetBranchFilterProps {
  value?: string
  onValueChange: (value: string | undefined) => void
  className?: string
}

export function BalanceSheetBranchFilter({ value, onValueChange, className }: BalanceSheetBranchFilterProps) {
  return (
    <Select
      value={value || "All"}
      onValueChange={(newValue) => onValueChange(newValue === "All" ? undefined : newValue)}
    >
      <SelectTrigger className={cn("w-[160px] min-h-[44px] hover:border-primary focus:ring-primary focus:border-primary", className)}>
        <Users className="h-4 w-4" />
        <SelectValue placeholder="All Teams" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="All">All Teams</SelectItem>
        <SelectItem value="Team A">Team A</SelectItem>
        <SelectItem value="Team B">Team B</SelectItem>
      </SelectContent>
    </Select>
  )
}

export type BalanceSheetBranchFilterValue = string | undefined