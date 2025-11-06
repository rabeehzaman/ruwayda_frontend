"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useVATReturn } from "@/hooks/use-vat-return"
import { formatCurrency } from "@/lib/formatting"
import { useLocale } from "@/i18n/locale-provider"
import type { DateRange } from "@/components/dashboard/date-filter"
import * as XLSX from 'xlsx'
import { format } from "date-fns"

interface VATReturnTablesProps {
  dateRange?: DateRange
  locationIds?: string[]
}

export function VATReturnTables({ dateRange, locationIds }: VATReturnTablesProps) {
  const { data, loading, error } = useVATReturn(dateRange, locationIds)
  const { t, isArabic } = useLocale()

  const handleExportToExcel = () => {
    if (!data) return

    try {
      // Create workbook with 3 sheets
      const wb = XLSX.utils.book_new()

      // Format invoices data
      const invoicesData = data.invoices.map(inv => ({
        [t("vatReturn.invoiceNumber")]: inv.invoice_number,
        [t("vatReturn.date")]: format(new Date(inv.invoice_date), 'yyyy-MM-dd'),
        [t("vatReturn.customer")]: inv.customer_name,
        [t("vatReturn.branch")]: inv.branch_name || 'N/A',
        [t("vatReturn.subtotal")]: inv.subtotal,
        [t("vatReturn.vatAmount")]: inv.vat_amount,
        [t("vatReturn.total")]: inv.total
      }))

      // Format credit notes data
      const creditNotesData = data.credit_notes.map(cn => ({
        [t("vatReturn.creditNoteNumber")]: cn.credit_note_number,
        [t("vatReturn.date")]: format(new Date(cn.credit_note_date), 'yyyy-MM-dd'),
        [t("vatReturn.customer")]: cn.customer_name,
        [t("vatReturn.branch")]: cn.branch_name || 'N/A',
        [t("vatReturn.subtotal")]: cn.subtotal,
        [t("vatReturn.vatAmount")]: cn.vat_amount,
        [t("vatReturn.total")]: cn.total
      }))

      // Format bills data
      const billsData = data.bills.map(bill => ({
        [t("vatReturn.billNumber")]: bill.bill_number,
        [t("vatReturn.date")]: format(new Date(bill.bill_date), 'yyyy-MM-dd'),
        [t("vatReturn.vendor")]: bill.vendor_name,
        [t("vatReturn.branch")]: bill.branch_name || 'N/A',
        [t("vatReturn.subtotal")]: bill.subtotal,
        [t("vatReturn.vatAmount")]: bill.vat_amount,
        [t("vatReturn.total")]: bill.total
      }))

      // Add sheets
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invoicesData), t("vatReturn.salesTab"))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(creditNotesData), t("vatReturn.returnsTab"))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(billsData), t("vatReturn.purchasesTab"))

      // Add summary sheet
      const summaryData = [
        { [t("vatReturn.summary.title")]: t("vatReturn.outputVat"), [t("vatReturn.vatAmount")]: data.summary.total_output_vat },
        { [t("vatReturn.summary.title")]: t("vatReturn.creditNoteVat"), [t("vatReturn.vatAmount")]: data.summary.total_credit_vat },
        { [t("vatReturn.summary.title")]: t("vatReturn.inputVat"), [t("vatReturn.vatAmount")]: data.summary.total_input_vat },
        { [t("vatReturn.summary.title")]: t("vatReturn.netVatPayable"), [t("vatReturn.vatAmount")]: data.summary.net_vat_payable }
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), t("vatReturn.summary.title"))

      // Generate filename with date range
      const fromDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : 'all'
      const toDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : 'all'
      const filename = `VAT-Return-${fromDate}-to-${toDate}.xlsx`

      // Write file
      XLSX.writeFile(wb, filename)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("vatReturn.loading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-muted-foreground">{t("common.loading")}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">{t("messages.error")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">{t("vatReturn.error")}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg sm:text-xl">{t("vatReturn.title")}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t("vatReturn.tables.showing")} {data.invoices.length + data.credit_notes.length + data.bills.length} {t("vatReturn.tables.transactions")}
            </CardDescription>
          </div>
          <Button onClick={handleExportToExcel} variant="outline" size="sm" className="w-full sm:w-auto min-h-[44px]">
            <Download className="h-4 w-4 mr-2" />
            <span className="truncate">{t("vatReturn.exportExcel")}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="invoices" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="invoices" className="text-xs sm:text-sm min-h-[44px] px-1 sm:px-2">
              {/* Mobile: Short label */}
              <span className="truncate md:hidden">Sales ({data.invoices.length})</span>
              {/* Desktop: Full label */}
              <span className="truncate hidden md:inline">{t("vatReturn.salesTab")} ({data.invoices.length})</span>
            </TabsTrigger>
            <TabsTrigger value="creditNotes" className="text-xs sm:text-sm min-h-[44px] px-1 sm:px-2">
              <span className="truncate md:hidden">Returns ({data.credit_notes.length})</span>
              <span className="truncate hidden md:inline">{t("vatReturn.returnsTab")} ({data.credit_notes.length})</span>
            </TabsTrigger>
            <TabsTrigger value="bills" className="text-xs sm:text-sm min-h-[44px] px-1 sm:px-2">
              <span className="truncate md:hidden">Bills ({data.bills.length})</span>
              <span className="truncate hidden md:inline">{t("vatReturn.purchasesTab")} ({data.bills.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="mt-4">
            {/* Mobile View - Summary Card */}
            <div className="md:hidden mb-4">
              <div className="bg-muted/50 border-2 border-primary/20 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm font-medium text-muted-foreground">
                    {t("vatReturn.salesTab")}
                  </div>
                  <span className="text-xs font-semibold">
                    {data.invoices.length} {data.invoices.length !== 1 ? 'invoices' : 'invoice'}
                  </span>
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {formatCurrency(data.summary.total_output_vat)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t("vatReturn.vatAmount")}
                </div>
              </div>
            </div>

            {/* Mobile View - Invoice Cards */}
            <div className="md:hidden space-y-2.5">
              {data.invoices.length > 0 ? (
                data.invoices.map((invoice, idx) => (
                  <div key={idx} className="bg-card border border-border p-3 rounded-lg shadow-sm space-y-2">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="text-sm font-bold text-primary truncate">
                          {invoice.invoice_number}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(invoice.invoice_date), 'yyyy-MM-dd')}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-muted rounded shrink-0">
                        {invoice.branch_name || 'N/A'}
                      </span>
                    </div>

                    {/* Customer */}
                    <div className="text-sm font-medium break-words leading-tight">
                      {invoice.customer_name}
                    </div>

                    {/* Amounts */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t text-[11px]">
                      <div>
                        <div className="text-muted-foreground mb-0.5">{t("vatReturn.subtotal")}</div>
                        <div className="font-medium text-sm">
                          {formatCurrency(invoice.subtotal)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-0.5">{t("vatReturn.vatAmount")}</div>
                        <div className="font-bold text-sm text-green-700 dark:text-green-400">
                          {formatCurrency(invoice.vat_amount)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground mb-0.5">{t("vatReturn.total")}</div>
                        <div className="font-bold text-sm">
                          {formatCurrency(invoice.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {t("vatReturn.no_data")}
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("vatReturn.invoiceNumber")}</TableHead>
                    <TableHead>{t("vatReturn.date")}</TableHead>
                    <TableHead>{t("vatReturn.customer")}</TableHead>
                    <TableHead>{t("vatReturn.branch")}</TableHead>
                    <TableHead className="text-right">{t("vatReturn.subtotal")}</TableHead>
                    <TableHead className="text-right">{t("vatReturn.vatAmount")}</TableHead>
                    <TableHead className="text-right">{t("vatReturn.total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        {t("vatReturn.no_data")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.invoices.map((invoice, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{format(new Date(invoice.invoice_date), 'yyyy-MM-dd')}</TableCell>
                        <TableCell>{invoice.customer_name}</TableCell>
                        <TableCell>{invoice.branch_name || 'N/A'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(invoice.subtotal)}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">
                          {formatCurrency(invoice.vat_amount)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(invoice.total)}</TableCell>
                      </TableRow>
                    ))
                  )}
                  {data.invoices.length > 0 && (
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={4}>{t("vatReturn.total")}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.invoices.reduce((sum, inv) => sum + inv.subtotal, 0))}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600">
                        {formatCurrency(data.summary.total_output_vat)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.invoices.reduce((sum, inv) => sum + inv.total, 0))}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Credit Notes Tab */}
          <TabsContent value="creditNotes" className="mt-4">
            {/* Mobile View - Summary Card */}
            <div className="md:hidden mb-4">
              <div className="bg-muted/50 border-2 border-primary/20 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm font-medium text-muted-foreground">
                    {t("vatReturn.returnsTab")}
                  </div>
                  <span className="text-xs font-semibold">
                    {data.credit_notes.length} {data.credit_notes.length !== 1 ? 'credit notes' : 'credit note'}
                  </span>
                </div>
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                  {formatCurrency(data.summary.total_credit_vat)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t("vatReturn.vatAmount")}
                </div>
              </div>
            </div>

            {/* Mobile View - Credit Note Cards */}
            <div className="md:hidden space-y-2.5">
              {data.credit_notes.length > 0 ? (
                data.credit_notes.map((cn, idx) => (
                  <div key={idx} className="bg-card border border-border p-3 rounded-lg shadow-sm space-y-2">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="text-sm font-bold text-primary truncate">
                          {cn.credit_note_number}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(cn.credit_note_date), 'yyyy-MM-dd')}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-muted rounded shrink-0">
                        {cn.branch_name || 'N/A'}
                      </span>
                    </div>

                    {/* Customer */}
                    <div className="text-sm font-medium break-words leading-tight">
                      {cn.customer_name}
                    </div>

                    {/* Amounts */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t text-[11px]">
                      <div>
                        <div className="text-muted-foreground mb-0.5">{t("vatReturn.subtotal")}</div>
                        <div className="font-medium text-sm">
                          {formatCurrency(cn.subtotal)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-0.5">{t("vatReturn.vatAmount")}</div>
                        <div className="font-bold text-sm text-orange-700 dark:text-orange-400">
                          {formatCurrency(cn.vat_amount)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground mb-0.5">{t("vatReturn.total")}</div>
                        <div className="font-bold text-sm">
                          {formatCurrency(cn.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {t("vatReturn.no_data")}
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("vatReturn.creditNoteNumber")}</TableHead>
                    <TableHead>{t("vatReturn.date")}</TableHead>
                    <TableHead>{t("vatReturn.customer")}</TableHead>
                    <TableHead>{t("vatReturn.branch")}</TableHead>
                    <TableHead className="text-right">{t("vatReturn.subtotal")}</TableHead>
                    <TableHead className="text-right">{t("vatReturn.vatAmount")}</TableHead>
                    <TableHead className="text-right">{t("vatReturn.total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.credit_notes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        {t("vatReturn.no_data")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.credit_notes.map((cn, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{cn.credit_note_number}</TableCell>
                        <TableCell>{format(new Date(cn.credit_note_date), 'yyyy-MM-dd')}</TableCell>
                        <TableCell>{cn.customer_name}</TableCell>
                        <TableCell>{cn.branch_name || 'N/A'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(cn.subtotal)}</TableCell>
                        <TableCell className="text-right font-semibold text-orange-600">
                          {formatCurrency(cn.vat_amount)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(cn.total)}</TableCell>
                      </TableRow>
                    ))
                  )}
                  {data.credit_notes.length > 0 && (
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={4}>{t("vatReturn.total")}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.credit_notes.reduce((sum, cn) => sum + cn.subtotal, 0))}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {formatCurrency(data.summary.total_credit_vat)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.credit_notes.reduce((sum, cn) => sum + cn.total, 0))}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Bills Tab */}
          <TabsContent value="bills" className="mt-4">
            {/* Mobile View - Summary Card */}
            <div className="md:hidden mb-4">
              <div className="bg-muted/50 border-2 border-primary/20 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm font-medium text-muted-foreground">
                    {t("vatReturn.purchasesTab")}
                  </div>
                  <span className="text-xs font-semibold">
                    {data.bills.length} {data.bills.length !== 1 ? 'bills' : 'bill'}
                  </span>
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {formatCurrency(data.summary.total_input_vat)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t("vatReturn.vatAmount")}
                </div>
              </div>
            </div>

            {/* Mobile View - Bill Cards */}
            <div className="md:hidden space-y-2.5">
              {data.bills.length > 0 ? (
                data.bills.map((bill, idx) => (
                  <div key={idx} className="bg-card border border-border p-3 rounded-lg shadow-sm space-y-2">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="text-sm font-bold text-primary truncate">
                          {bill.bill_number}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(bill.bill_date), 'yyyy-MM-dd')}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-muted rounded shrink-0">
                        {bill.branch_name || 'N/A'}
                      </span>
                    </div>

                    {/* Vendor */}
                    <div className="text-sm font-medium break-words leading-tight">
                      {bill.vendor_name}
                    </div>

                    {/* Amounts */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t text-[11px]">
                      <div>
                        <div className="text-muted-foreground mb-0.5">{t("vatReturn.subtotal")}</div>
                        <div className="font-medium text-sm">
                          {formatCurrency(bill.subtotal)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-0.5">{t("vatReturn.vatAmount")}</div>
                        <div className="font-bold text-sm text-blue-700 dark:text-blue-400">
                          {formatCurrency(bill.vat_amount)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground mb-0.5">{t("vatReturn.total")}</div>
                        <div className="font-bold text-sm">
                          {formatCurrency(bill.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {t("vatReturn.no_data")}
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("vatReturn.billNumber")}</TableHead>
                    <TableHead>{t("vatReturn.date")}</TableHead>
                    <TableHead>{t("vatReturn.vendor")}</TableHead>
                    <TableHead>{t("vatReturn.branch")}</TableHead>
                    <TableHead className="text-right">{t("vatReturn.subtotal")}</TableHead>
                    <TableHead className="text-right">{t("vatReturn.vatAmount")}</TableHead>
                    <TableHead className="text-right">{t("vatReturn.total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.bills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        {t("vatReturn.no_data")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.bills.map((bill, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{bill.bill_number}</TableCell>
                        <TableCell>{format(new Date(bill.bill_date), 'yyyy-MM-dd')}</TableCell>
                        <TableCell>{bill.vendor_name}</TableCell>
                        <TableCell>{bill.branch_name || 'N/A'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(bill.subtotal)}</TableCell>
                        <TableCell className="text-right font-semibold text-blue-600">
                          {formatCurrency(bill.vat_amount)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(bill.total)}</TableCell>
                      </TableRow>
                    ))
                  )}
                  {data.bills.length > 0 && (
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={4}>{t("vatReturn.total")}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.bills.reduce((sum, bill) => sum + bill.subtotal, 0))}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {formatCurrency(data.summary.total_input_vat)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.bills.reduce((sum, bill) => sum + bill.total, 0))}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
