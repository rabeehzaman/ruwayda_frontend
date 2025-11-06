"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { CustomerAgingBalance } from "@/components/customers/customer-aging-balance"
import { CustomerAgingKPICards } from "@/components/customers/customer-aging-kpi-cards"
import { TopOverdueCustomers } from "@/components/customers/top-overdue-customers"
import { RiskDistributionChart } from "@/components/customers/risk-distribution-chart"
import { CustomerOwnerPerformance } from "@/components/customers/customer-owner-performance"
import { CustomerOwnerFilter } from "@/components/filters/customer-owner-filter"
import { useCustomerOwnerFilter } from "@/contexts/customer-owner-filter-context"
import { useLocale } from "@/i18n/locale-provider"

export default function CustomersPage() {
  const { t } = useLocale()
  const { selectedOwners } = useCustomerOwnerFilter()

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6 w-full max-w-full">
        <div className="px-1">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">{t("pages.customers.title")}</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-tight">
            {t("pages.customers.description")}
          </p>
        </div>
      </div>

      {/* Master Customer Owner Filter */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-muted/30 rounded-lg w-full max-w-full overflow-x-hidden">
        <div>
          <h3 className="font-medium text-sm sm:text-base">{t("pages.customers.filter_title")}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("pages.customers.filter_description")}
          </p>
        </div>

        <CustomerOwnerFilter showLabel={false} showDescription={false} />
      </div>

      {/* KPI Summary Cards */}
      <div className="mb-4 sm:mb-6 w-full max-w-full">
        <CustomerAgingKPICards selectedOwners={selectedOwners} />
      </div>

      {/* Charts and Priority Lists */}
      <div className="grid gap-3 sm:gap-4 md:gap-6 lg:grid-cols-2 mb-4 sm:mb-6 w-full max-w-full">
        <div className="w-full max-w-full overflow-x-hidden">
          <RiskDistributionChart selectedOwners={selectedOwners} />
        </div>
        <div className="w-full max-w-full overflow-x-hidden">
          <TopOverdueCustomers selectedOwners={selectedOwners} />
        </div>
      </div>

      {/* Customer Owner Performance */}
      <div className="mb-4 sm:mb-6 w-full max-w-full overflow-x-hidden">
        <CustomerOwnerPerformance selectedOwners={selectedOwners} />
      </div>

      {/* Detailed Customer Aging Table */}
      <div className="w-full max-w-full overflow-x-hidden">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 px-1">{t("pages.customers.detailed_aging")}</h3>
        <CustomerAgingBalance selectedOwners={selectedOwners} />
      </div>
    </DashboardLayout>
  )
}