"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Scale, Building, Package, Users, TrendingUp } from "lucide-react"
import { formatCurrencyTable } from "@/lib/formatting"
import { useBalanceSheet } from "@/hooks/use-balance-sheet"
import { BalanceSheetBranchFilter, type BalanceSheetBranchFilterValue } from "./balance-sheet-branch-filter"
import { useLocale } from "@/i18n/locale-provider"
import type { DateRange } from "@/components/dashboard/date-filter"

interface BalanceSheetProps {
  dateRange?: DateRange
  branchFilter?: string
}

export function BalanceSheet({ dateRange }: BalanceSheetProps) {
  const { t } = useLocale()
  const [balanceSheetBranchFilter, setBalanceSheetBranchFilter] = React.useState<BalanceSheetBranchFilterValue>(undefined)
  const { data, loading, error } = useBalanceSheet(dateRange, balanceSheetBranchFilter)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            {t("financials.balance_sheet.title")}
          </CardTitle>
          <CardDescription>
            {t("financials.balance_sheet.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            {t("financials.balance_sheet.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500">{t("financials.balance_sheet.error")} {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const { totalReceivables, totalStock, totalAssets, totalVendorPayable, totalLiabilities, netWorth } = data

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              {t("financials.balance_sheet.title")}
            </CardTitle>
            <CardDescription>
              {t("financials.balance_sheet.description")}
              <div className="flex items-center gap-2 mt-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>{t("financials.balance_sheet.sourced_from_receivables")}</span>
              </div>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <BalanceSheetBranchFilter 
              value={balanceSheetBranchFilter}
              onValueChange={setBalanceSheetBranchFilter}
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-full overflow-x-hidden">
          <Card className="w-full max-w-full">
            <CardContent className="p-4 sm:p-6 w-full max-w-full overflow-x-hidden">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{t("financials.balance_sheet.total_assets")}</p>
                <Building className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-xl sm:text-2xl font-bold break-all">{formatCurrencyTable(totalAssets)}</p>
                <Badge variant="default" className="text-xs">
                  {t("financials.balance_sheet.assets")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("financials.balance_sheet.receivables_plus_stock")}
              </p>
            </CardContent>
          </Card>

          <Card className="w-full max-w-full">
            <CardContent className="p-4 sm:p-6 w-full max-w-full overflow-x-hidden">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{t("financials.balance_sheet.total_liabilities")}</p>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-xl sm:text-2xl font-bold break-all">{formatCurrencyTable(totalLiabilities)}</p>
                <Badge variant="destructive" className="text-xs">
                  {t("financials.balance_sheet.liabilities")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("financials.balance_sheet.vendor_payables")}
              </p>
            </CardContent>
          </Card>

          <Card className="w-full max-w-full">
            <CardContent className="p-4 sm:p-6 w-full max-w-full overflow-x-hidden">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{t("financials.balance_sheet.net_worth")}</p>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-xl sm:text-2xl font-bold break-all">{formatCurrencyTable(netWorth)}</p>
                <Badge variant={netWorth >= 0 ? "default" : "destructive"} className="text-xs">
                  {netWorth >= 0 ? t("financials.balance_sheet.positive") : t("financials.balance_sheet.negative")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("financials.balance_sheet.assets_minus_liabilities")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* T-Shaped Balance Sheet */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("financials.balance_sheet.statement_title")}</CardTitle>
            <CardDescription>{t("financials.balance_sheet.statement_description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 w-full max-w-full overflow-x-hidden">
              {/* Assets Side */}
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b-2 border-primary">
                  <div className="font-bold text-lg text-primary">{t("financials.balance_sheet.assets_header")}</div>
                  <Building className="h-5 w-5 text-primary" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-dashed">
                    <div className="font-semibold">{t("financials.balance_sheet.current_assets")}</div>
                    <div></div>
                  </div>
                  
                  <div className="flex justify-between items-center pl-2 sm:pl-4">
                    <div className="text-muted-foreground flex items-center gap-2 text-sm truncate">
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{t("financials.balance_sheet.total_receivables")}</span>
                    </div>
                    <div className="font-medium text-sm sm:text-base break-all">{formatCurrencyTable(totalReceivables)}</div>
                  </div>
                  
                  <div className="flex justify-between items-center pl-2 sm:pl-4">
                    <div className="text-muted-foreground flex items-center gap-2 text-sm truncate">
                      <Package className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{t("financials.balance_sheet.total_stock")}</span>
                    </div>
                    <div className="font-medium text-sm sm:text-base break-all">{formatCurrencyTable(totalStock)}</div>
                  </div>
                  
                  <div className="flex justify-between items-center font-bold border-t-2 border-primary pt-3 bg-primary/5 px-4 py-3 rounded-lg">
                    <div className="text-primary">{t("financials.balance_sheet.total_assets_header")}</div>
                    <div className="text-primary text-lg">
                      <Badge variant="default" className="text-base px-3 py-1">
                        {formatCurrencyTable(totalAssets)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Liabilities Side */}
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b-2 border-destructive">
                  <div className="font-bold text-lg text-destructive">{t("financials.balance_sheet.liabilities_header")}</div>
                  <Users className="h-5 w-5 text-destructive" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-dashed">
                    <div className="font-semibold">{t("financials.balance_sheet.current_liabilities")}</div>
                    <div></div>
                  </div>
                  
                  <div className="flex justify-between items-center pl-2 sm:pl-4">
                    <div className="text-muted-foreground flex items-center gap-2 text-sm truncate">
                      <Building className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{t("financials.balance_sheet.total_vendor_payable")}</span>
                    </div>
                    <div className="font-medium text-sm sm:text-base break-all">{formatCurrencyTable(totalVendorPayable)}</div>
                  </div>
                  
                  <div className="flex justify-between items-center font-bold border-t-2 border-destructive pt-3 bg-destructive/5 px-4 py-3 rounded-lg">
                    <div className="text-destructive">{t("financials.balance_sheet.total_liabilities_header")}</div>
                    <div className="text-destructive text-lg">
                      <Badge variant="destructive" className="text-base px-3 py-1">
                        {formatCurrencyTable(totalLiabilities)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Worth Calculation */}
            <div className="mt-8 pt-6 border-t-2">
              <div className="flex justify-between items-center py-4 bg-green-50 dark:bg-green-950/30 px-6 rounded-lg border-2 border-green-200 dark:border-green-800">
                <div className="font-bold text-xl text-green-800 dark:text-green-200 flex items-center gap-2">
                  <Scale className="h-6 w-6" />
                  {t("financials.balance_sheet.net_worth_calculation")}
                </div>
                <div className="font-bold text-xl">
                  <Badge variant={netWorth >= 0 ? "default" : "destructive"} className="text-lg px-4 py-2">
                    {formatCurrencyTable(netWorth)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Balance Verification */}
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-center">
                <div className="font-semibold mb-2">{t("financials.balance_sheet.equation_verification")}</div>
                <div className="text-muted-foreground">
                  {t("financials.balance_sheet.assets")} ({formatCurrencyTable(totalAssets)}) = {t("financials.balance_sheet.liabilities")} ({formatCurrencyTable(totalLiabilities)}) + {t("financials.balance_sheet.net_worth")} ({formatCurrencyTable(netWorth)})
                </div>
                <div className="mt-2">
                  <Badge variant={Math.abs(totalAssets - (totalLiabilities + netWorth)) < 0.01 ? "default" : "destructive"} className="text-xs">
                    {Math.abs(totalAssets - (totalLiabilities + netWorth)) < 0.01 ? t("financials.balance_sheet.balanced") : t("financials.balance_sheet.imbalanced")}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}