"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Receipt, ReceiptText } from "lucide-react"
import { useVATReturn } from "@/hooks/use-vat-return"
import { formatCurrency } from "@/lib/formatting"
import { useLocale } from "@/i18n/locale-provider"
import type { DateRange } from "@/components/dashboard/date-filter"

interface VATReturnSummaryProps {
  dateRange?: DateRange
  locationIds?: string[]
}

export function VATReturnSummary({ dateRange, locationIds }: VATReturnSummaryProps) {
  const { data, loading, error } = useVATReturn(dateRange, locationIds)
  const { t, isArabic } = useLocale()

  if (error) {
    return (
      <div className="text-red-600 dark:text-red-400 text-center py-4">
        {t("vatReturn.error")}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-muted-foreground text-center py-4">
        {t("vatReturn.no_data")}
      </div>
    )
  }

  const summary = data.summary
  const isRefundable = summary.net_vat_payable < 0

  return (
    <div className="space-y-4">
      {/* Summary Title */}
      <div className={isArabic ? 'text-right' : ''}>
        <h3 className="text-lg font-semibold">{t("vatReturn.summary.title")}</h3>
        <p className="text-sm text-muted-foreground">{t("vatReturn.summary.description")}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Output VAT (Invoices) */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("vatReturn.outputVat")}
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(summary.total_output_vat)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("vatReturn.summary.outputVatDescription")}
            </p>
          </CardContent>
        </Card>

        {/* Less: Credit VAT (Credit Notes) */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("vatReturn.creditNoteVat")}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent dark:text-accent">
              {formatCurrency(summary.total_credit_vat)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("vatReturn.summary.creditVatDescription")}
            </p>
          </CardContent>
        </Card>

        {/* Input VAT (Bills) */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("vatReturn.inputVat")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(summary.total_input_vat)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("vatReturn.summary.inputVatDescription")}
            </p>
          </CardContent>
        </Card>

        {/* Net VAT Payable/Refundable */}
        <Card className={`hover:shadow-md transition-shadow ${isRefundable ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRefundable ? t("vatReturn.netVatRefundable") : t("vatReturn.netVatPayable")}
            </CardTitle>
            <ReceiptText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isRefundable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(Math.abs(summary.net_vat_payable))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("vatReturn.summary.netVatDescription")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Counts */}
      <div className={`flex items-center justify-end text-xs text-muted-foreground gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
        <span>{data.invoices.length} {t("vatReturn.salesTab")}</span>
        <span>•</span>
        <span>{data.credit_notes.length} {t("vatReturn.returnsTab")}</span>
        <span>•</span>
        <span>{data.bills.length} {t("vatReturn.purchasesTab")}</span>
      </div>
    </div>
  )
}
