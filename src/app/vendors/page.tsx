"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { VendorAgingBalance } from "@/components/vendors/vendor-aging-balance"
import { VendorKPICards } from "@/components/vendors/vendor-kpi-cards"
import { useLocale } from "@/i18n/locale-provider"

export default function VendorsPage() {
  const { t } = useLocale()

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 mb-6 w-full max-w-full overflow-x-hidden">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{t("pages.vendors.title")}</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("pages.vendors.description")}
          </p>
        </div>
      </div>

      {/* Vendor Dashboard Components */}
      <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
        {/* KPI Cards Row */}
        <VendorKPICards locationIds={null} />

        {/* Vendor Aging Balance */}
        <VendorAgingBalance locationIds={null} />
      </div>
    </DashboardLayout>
  )
}
