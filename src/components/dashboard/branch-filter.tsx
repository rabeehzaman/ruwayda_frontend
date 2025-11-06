"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocale } from "@/i18n/locale-provider"
import { useActiveBranches } from "@/hooks/use-active-branches"
import { useIsAdmin, useUserBranches } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import type { DateRange } from "@/components/dashboard/date-filter"

interface BranchFilterProps {
  value?: string
  onValueChange: (value: string | undefined) => void
  className?: string
  dateRange?: DateRange
}

export function BranchFilter({ value, onValueChange, className, dateRange }: BranchFilterProps) {
  const { t } = useLocale()
  const isAdmin = useIsAdmin()
  const userBranches = useUserBranches()
  const { branches: activeBranches, loading, error } = useActiveBranches(dateRange)

  // Filter branches to only those user can access
  const accessibleBranches = React.useMemo(() => {
    if (isAdmin) return activeBranches // Admins see all
    return activeBranches.filter(branch => userBranches.includes(branch))
  }, [isAdmin, activeBranches, userBranches])

  // Reset branch filter when active branches change and current selection is not available
  React.useEffect(() => {
    if (!loading && value && !accessibleBranches.includes(value)) {
      onValueChange(undefined)
    }
  }, [accessibleBranches, value, loading, onValueChange])

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Badge variant="destructive" className="text-xs">
          {t('common.admin_view')}
        </Badge>
      )}
      <Select
        value={value || "all"}
        onValueChange={(newValue) => onValueChange(newValue === "all" ? undefined : newValue)}
        disabled={loading}
      >
        <SelectTrigger className={cn("w-[200px] min-h-[44px] hover:border-primary focus:ring-primary focus:border-primary", className)}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Building2 className="h-4 w-4" />
          )}
          <SelectValue placeholder={loading ? t("filters.loading") : t("filters.all_branches")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {isAdmin ? t("common.all_branches_admin") : t("filters.all_branches")}
          </SelectItem>
          {error ? (
            <SelectItem value="error" disabled>{t("filters.error_loading_branches")}</SelectItem>
          ) : (
            accessibleBranches.map((branch) => (
              <SelectItem key={branch} value={branch}>
                {branch}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  )
}

export type BranchFilterValue = string | undefined