"use client"

import * as React from "react"
import { User } from "lucide-react"
import { useCustomerOwnerFilter } from "@/contexts/customer-owner-filter-context"
import { MultiSelect } from "@/components/ui/multi-select"
import { useLocale } from "@/i18n/locale-provider"

interface CustomerOwnerFilterProps {
  className?: string
  showLabel?: boolean
  showDescription?: boolean
}

export function CustomerOwnerFilter({
  className = "",
  showLabel = true,
  showDescription = true
}: CustomerOwnerFilterProps) {
  const { t } = useLocale()
  const { selectedOwners, setSelectedOwners, availableOwners, loadingOwners } = useCustomerOwnerFilter()

  const options = React.useMemo(() =>
    availableOwners.map(owner => ({
      value: owner,
      label: owner
    })),
    [availableOwners]
  )

  return (
    <div className={`flex flex-col sm:flex-row gap-3 items-start sm:items-center ${className}`}>
      {showLabel && (
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground whitespace-nowrap">
          <User className="h-4 w-4 flex-shrink-0" />
          <span>{t("pages.customers.customer_owner")}</span>
        </div>
      )}
      <MultiSelect
        options={options}
        value={selectedOwners}
        onValueChange={setSelectedOwners}
        placeholder={t("pages.customers.all_owners")}
        searchPlaceholder={t("pages.customers.search_owners")}
        disabled={loadingOwners}
        loading={loadingOwners}
        className="w-full sm:w-auto sm:min-w-[300px]"
        maxDisplay={2}
      />
      {showDescription && (
        <p className="text-xs text-muted-foreground">
          {selectedOwners.length === 0
            ? t("pages.customers.filter_description")
            : `${t("common.filtering_by")} ${selectedOwners.length} ${t("common.owner")}${selectedOwners.length > 1 ? 's' : ''}`
          }
        </p>
      )}
    </div>
  )
}
