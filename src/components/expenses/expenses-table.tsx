"use client"

import * as React from "react"
import { useExpenses } from "@/hooks/use-expenses"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/formatting"
import { useLocale } from "@/i18n/locale-provider"
import { format } from "date-fns"
import type { DateRange } from "@/components/dashboard/date-filter"

interface ExpensesTableProps {
  locationIds?: string[]
  dateRange: DateRange
}

export function ExpensesTable({ locationIds, dateRange }: ExpensesTableProps) {
  const { t } = useLocale()
  const { data: expenses, loading, error } = useExpenses(locationIds, dateRange)
  const [searchTerm, setSearchTerm] = React.useState("")

  // Filter and sort expenses based on search term (biggest first)
  const filteredExpenses = React.useMemo(() => {
    const filtered = searchTerm 
      ? (expenses || []).filter(expense =>
          expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.branch_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : expenses || []
    
    // Sort by amount (biggest first)
    return [...filtered].sort((a, b) => {
      const amountA = typeof a.amount === 'string' ? parseFloat(a.amount) || 0 : a.amount
      const amountB = typeof b.amount === 'string' ? parseFloat(b.amount) || 0 : b.amount
      return amountB - amountA
    })
  }, [expenses, searchTerm])

  // Calculate total amount
  const totalAmount = React.useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => {
      const amount = typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : expense.amount
      return sum + amount
    }, 0)
  }, [filteredExpenses])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("pages.expenses.loading_expenses")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-64 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("pages.expenses.error_loading_expenses")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>{t("pages.expenses.error_loading_message")}{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pages.expenses.expenses_table_title")}</CardTitle>
        <CardDescription>
          {filteredExpenses.length} {t("pages.expenses.expenses_count")} {expenses?.length || 0} {t("pages.expenses.expenses_plural")}
          {locationIds && locationIds.length > 0 && ` • ${locationIds.length} ${locationIds.length === 1 ? t("pages.expenses.location_selected") : t("pages.expenses.locations_selected")}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search Input */}
        <div className="mb-4">
          <Input
            placeholder={t("pages.expenses.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm sm:max-w-md w-full sm:w-auto min-h-[44px]"
          />
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {/* Total Summary Card */}
          <div className="bg-muted/50 border-2 border-primary/20 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <div className="text-sm font-medium text-muted-foreground">{t("pages.expenses.total_row")}</div>
              <Badge variant="secondary" className="text-xs">
                {filteredExpenses.length} {filteredExpenses.length !== 1 ? t("pages.expenses.expenses_plural") : t("pages.expenses.expense_singular")}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {formatCurrency(totalAmount)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {locationIds && locationIds.length > 0 ? `${locationIds.length} ${locationIds.length === 1 ? t("pages.expenses.location_selected") : t("pages.expenses.locations_selected")}` : t("pages.expenses.all_branches")}
            </div>
          </div>

          {/* Expense Cards */}
          {filteredExpenses.length > 0 ? (
            <div className="space-y-2.5">
              {filteredExpenses.map((expense, index) => {
                const expenseAmount = typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : expense.amount
                const percentage = totalAmount > 0 ? (expenseAmount / totalAmount) * 100 : 0

                return (
                  <div key={index} className="bg-card border border-border p-3 rounded-lg shadow-sm space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="text-xs text-muted-foreground">
                        {expense.date
                          ? format(new Date(expense.date), "MMM dd, yyyy")
                          : "-"
                        }
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {expense.branch_name}
                      </Badge>
                    </div>

                    <div className="text-sm font-medium break-words leading-tight">
                      {expense.description}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t text-[11px]">
                      <div>
                        <div className="text-muted-foreground mb-0.5">Amount</div>
                        <div className="font-bold text-base text-green-700 dark:text-green-400">
                          {formatCurrency(expenseAmount)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground mb-0.5">% of Total</div>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchTerm ? t("pages.expenses.no_match_search") : t("pages.expenses.no_expenses_found")}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead>Branch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Total Row */}
              <TableRow className="bg-muted/50 font-semibold border-b-2">
                <TableCell className="font-bold">{t("pages.expenses.total_row")}</TableCell>
                <TableCell className="font-bold">
                  {filteredExpenses.length} {filteredExpenses.length !== 1 ? t("pages.expenses.expenses_plural") : t("pages.expenses.expense_singular")}
                </TableCell>
                <TableCell className="text-right font-bold text-lg">
                  {formatCurrency(totalAmount)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  100.0%
                </TableCell>
                <TableCell className="font-bold">
                  {locationIds && locationIds.length > 0 ? `${locationIds.length} ${locationIds.length === 1 ? t("pages.expenses.location_selected") : t("pages.expenses.locations_selected")}` : t("pages.expenses.all_branches")}
                </TableCell>
              </TableRow>
              
              {/* Expense Rows */}
              {filteredExpenses.map((expense, index) => {
                const expenseAmount = typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : expense.amount
                const percentage = totalAmount > 0 ? (expenseAmount / totalAmount) * 100 : 0
                
                return (
                  <TableRow key={index}>
                    <TableCell>
                      {expense.date 
                        ? format(new Date(expense.date), "MMM dd, yyyy")
                        : "-"
                      }
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium whitespace-normal break-words">
                        {expense.description}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(expenseAmount)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {percentage.toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="whitespace-nowrap">
                        {expense.branch_name}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            {filteredExpenses.length === 0 && (
              <TableCaption>
                {searchTerm ? t("pages.expenses.no_match_search") : t("pages.expenses.no_expenses_found")}
              </TableCaption>
            )}
          </Table>
        </div>
        {/* End Desktop Table View */}
      </CardContent>
    </Card>
  )
}