"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, DollarSign, Calculator, Receipt, Target } from "lucide-react"
import { useOptimizedProfitByInvoice } from "@/hooks/use-optimized-data"
import { useExpenses } from "@/hooks/use-expenses"
import { formatCurrencyTable } from "@/lib/formatting"
import { useLocale } from "@/i18n/locale-provider"
import type { DateRange } from "@/components/dashboard/date-filter"

interface StatementOfProfitAndLossProps {
  dateRange?: DateRange
  locationIds?: string[]
}

interface ProfitAndLossData {
  totalSales: number
  costOfGoodsSold: number
  grossProfit: number
  grossProfitMargin: number
  totalExpenses: number
  netProfit: number
  netProfitMargin: number
}

export function StatementOfProfitAndLoss({ dateRange, locationIds }: StatementOfProfitAndLossProps) {
  const { t } = useLocale()

  // Load all invoice data to calculate totals
  const {
    data: invoiceData,
    loading: invoiceLoading,
    error: invoiceError
  } = useOptimizedProfitByInvoice(dateRange, locationIds, 10000) // Load all data

  // Load expenses data with same filters
  const {
    data: expensesData,
    loading: expensesLoading,
    error: expensesError
  } = useExpenses(locationIds, dateRange)


  // Calculate P&L data from invoice and expenses data
  const profitAndLossData = React.useMemo((): ProfitAndLossData => {
    const totalSales = invoiceData?.reduce((sum, invoice) => sum + (invoice.total_sale_price || 0), 0) || 0
    const costOfGoodsSold = invoiceData?.reduce((sum, invoice) => sum + (invoice.total_cost || 0), 0) || 0
    const grossProfit = totalSales - costOfGoodsSold
    const grossProfitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0
    
    const totalExpenses = expensesData?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0
    
    const netProfit = grossProfit - totalExpenses
    const netProfitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0

    return {
      totalSales,
      costOfGoodsSold,
      grossProfit,
      grossProfitMargin,
      totalExpenses,
      netProfit,
      netProfitMargin
    }
  }, [invoiceData, expensesData])

  if (invoiceLoading || expensesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {t("financials.profit_loss.title")}
          </CardTitle>
          <CardDescription>
            {t("financials.profit_loss.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </div>
                  <Skeleton className="h-8 w-[120px]" />
                  <Skeleton className="h-3 w-[80px] mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (invoiceError || expensesError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {t("financials.profit_loss.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500">{t("financials.profit_loss.error")} {invoiceError || expensesError}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { totalSales, costOfGoodsSold, grossProfit, grossProfitMargin, totalExpenses, netProfit, netProfitMargin } = profitAndLossData

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          {t("financials.profit_loss.title")}
        </CardTitle>
        <CardDescription>
          {t("financials.profit_loss.description")} - {invoiceData.length} {t("financials.profit_loss.invoices_and")} {expensesData?.length || 0} {t("financials.profit_loss.expenses_count")}
          <div className="flex items-center gap-2 mt-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>{t("financials.profit_loss.sourced_from")}</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 w-full max-w-full overflow-x-hidden">
          {/* Total Sales */}
          <Card className="w-full max-w-full">
            <CardContent className="p-4 sm:p-6 w-full max-w-full overflow-x-hidden">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{t("financials.profit_loss.total_sales")}</p>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-lg xl:text-xl 2xl:text-2xl font-bold tabular-nums">{formatCurrencyTable(totalSales)}</p>
                <Badge variant="default" className="text-xs">
                  {t("financials.profit_loss.revenue")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("financials.profit_loss.total_sales_description")}
              </p>
            </CardContent>
          </Card>

          {/* Cost of Goods Sold */}
          <Card className="w-full max-w-full">
            <CardContent className="p-4 sm:p-6 w-full max-w-full overflow-x-hidden">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{t("financials.profit_loss.cost_of_goods_sold")}</p>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-lg xl:text-xl 2xl:text-2xl font-bold tabular-nums">{formatCurrencyTable(costOfGoodsSold)}</p>
                <Badge variant="destructive" className="text-xs">
                  {t("financials.profit_loss.cogs")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("financials.profit_loss.total_cost_description")}
              </p>
            </CardContent>
          </Card>

          {/* Gross Profit */}
          <Card className="w-full max-w-full">
            <CardContent className="p-4 sm:p-6 w-full max-w-full overflow-x-hidden">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{t("financials.profit_loss.gross_profit")}</p>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-lg xl:text-xl 2xl:text-2xl font-bold tabular-nums">{formatCurrencyTable(grossProfit)}</p>
                <Badge variant={grossProfit >= 0 ? "default" : "destructive"} className="text-xs">
                  {grossProfit >= 0 ? t("financials.profit_loss.profit") : t("financials.profit_loss.loss")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("financials.profit_loss.gross_profit_description")}
              </p>
            </CardContent>
          </Card>

          {/* Gross Profit Margin */}
          <Card className="w-full max-w-full">
            <CardContent className="p-4 sm:p-6 w-full max-w-full overflow-x-hidden">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{t("financials.profit_loss.gross_profit_margin")}</p>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-lg xl:text-xl 2xl:text-2xl font-bold tabular-nums">{grossProfitMargin.toFixed(1)}%</p>
                <Badge variant={grossProfitMargin >= 0 ? "default" : "destructive"} className="text-xs">
                  {grossProfitMargin >= 0 ? t("financials.profit_loss.positive") : t("financials.profit_loss.negative")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("financials.profit_loss.profit_percentage_description")}
              </p>
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card className="w-full max-w-full">
            <CardContent className="p-4 sm:p-6 w-full max-w-full overflow-x-hidden">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{t("financials.profit_loss.total_expenses")}</p>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-lg xl:text-xl 2xl:text-2xl font-bold tabular-nums">{formatCurrencyTable(totalExpenses)}</p>
                <Badge variant="secondary" className="text-xs">
                  {t("financials.profit_loss.operating")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("financials.profit_loss.total_expenses_description")}
              </p>
            </CardContent>
          </Card>

          {/* Net Profit */}
          <Card className="w-full max-w-full">
            <CardContent className="p-4 sm:p-6 w-full max-w-full overflow-x-hidden">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{t("financials.profit_loss.net_profit")}</p>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-lg xl:text-xl 2xl:text-2xl font-bold tabular-nums">{formatCurrencyTable(netProfit)}</p>
                <Badge variant={netProfit >= 0 ? "default" : "destructive"} className="text-xs">
                  {netProfit >= 0 ? t("financials.profit_loss.profit") : t("financials.profit_loss.loss")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("financials.profit_loss.net_profit_description")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Statement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("financials.profit_loss.statement_title")}</CardTitle>
            <CardDescription>{t("financials.profit_loss.statement_description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Revenue Section */}
              <div className="flex justify-between items-center py-3 border-b">
                <div className="font-semibold text-lg">{t("financials.profit_loss.revenue")}</div>
                <div></div>
              </div>
              <div className="flex justify-between items-center pl-4">
                <div className="text-muted-foreground">{t("financials.profit_loss.total_sales")}</div>
                <div className="font-medium">{formatCurrencyTable(totalSales)}</div>
              </div>
              <div className="flex justify-between items-center font-semibold border-b pb-3">
                <div>{t("financials.profit_loss.total_revenue")}</div>
                <div>{formatCurrencyTable(totalSales)}</div>
              </div>

              {/* Cost Section */}
              <div className="flex justify-between items-center py-3 border-b">
                <div className="font-semibold text-lg">{t("financials.profit_loss.cost_of_sales")}</div>
                <div></div>
              </div>
              <div className="flex justify-between items-center pl-4">
                <div className="text-muted-foreground">{t("financials.profit_loss.cost_of_goods_sold")}</div>
                <div className="font-medium">({formatCurrencyTable(costOfGoodsSold)})</div>
              </div>
              <div className="flex justify-between items-center font-semibold border-b pb-3">
                <div>{t("financials.profit_loss.total_cost_of_sales")}</div>
                <div>({formatCurrencyTable(costOfGoodsSold)})</div>
              </div>

              {/* Gross Profit Section */}
              <div className="flex justify-between items-center py-4 bg-muted/50 px-4 rounded-lg">
                <div className="font-bold text-lg">{t("financials.profit_loss.gross_profit")}</div>
                <div className="font-bold text-lg">
                  <Badge variant={grossProfit >= 0 ? "default" : "destructive"} className="text-base px-3 py-1">
                    {formatCurrencyTable(grossProfit)}
                  </Badge>
                </div>
              </div>

              {/* Margin Analysis */}
              <div className="flex justify-between items-center py-3 bg-primary/5 px-4 rounded-lg">
                <div className="font-semibold">{t("financials.profit_loss.gross_profit_margin")}</div>
                <div className="font-semibold">
                  <Badge variant={grossProfitMargin >= 0 ? "default" : "destructive"} className="text-base px-3 py-1">
                    {grossProfitMargin.toFixed(2)}%
                  </Badge>
                </div>
              </div>

              {/* Operating Expenses Section */}
              <div className="flex justify-between items-center py-3 border-b">
                <div className="font-semibold text-lg">{t("financials.profit_loss.operating_expenses")}</div>
                <div></div>
              </div>
              
              {/* Individual Expenses Breakdown */}
              {expensesData && expensesData.length > 0 && (
                <div className="pl-4 space-y-2 py-2">
                  {expensesData
                    .sort((a, b) => (b.amount || 0) - (a.amount || 0)) // Sort by amount descending
                    .slice(0, 10) // Show top 10 expenses
                    .map((expense, index) => {
                      const percentage = totalExpenses > 0 ? ((expense.amount || 0) / totalExpenses) * 100 : 0
                      const shortDescription = expense.description.length > 40 
                        ? expense.description.substring(0, 40) + '...' 
                        : expense.description
                      const mediumDescription = expense.description.length > 80
                        ? expense.description.substring(0, 80) + '...'
                        : expense.description
                      
                      return (
                        <div key={`${expense.date}-${index}`} className="flex justify-between items-center">
                          <div className="flex-1 min-w-0 pr-2">
                            {/* Mobile and Small screens - truncated */}
                            <div className="text-xs text-muted-foreground truncate sm:hidden" title={expense.description}>
                              {shortDescription}
                            </div>
                            {/* Medium screens - medium length */}
                            <div className="text-xs text-muted-foreground truncate hidden sm:block xl:hidden" title={expense.description}>
                              {mediumDescription}
                            </div>
                            {/* Large screens - full description */}
                            <div className="text-xs text-muted-foreground hidden xl:block break-words" title={expense.description}>
                              {expense.description}
                            </div>
                            <div className="text-xs text-muted-foreground/80">
                              {expense.date} • {expense.branch_name}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="secondary" className="text-xs">
                              {percentage.toFixed(1)}%
                            </Badge>
                            <span className="text-sm font-medium text-muted-foreground">
                              {formatCurrencyTable(expense.amount || 0)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  
                  {expensesData.length > 10 && (
                    <div className="flex justify-between items-center pt-2 border-t border-dashed">
                      <div className="text-xs text-muted-foreground italic">
                        +{expensesData.length - 10} {t("financials.profit_loss.more_expenses")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrencyTable(
                          expensesData.slice(10).reduce((sum, exp) => sum + (exp.amount || 0), 0)
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-between items-center font-semibold border-b pb-3">
                <div>{t("financials.profit_loss.total_operating_expenses")}</div>
                <div>({formatCurrencyTable(totalExpenses)})</div>
              </div>

              {/* Net Profit Section */}
              <div className="flex justify-between items-center py-4 bg-green-50 dark:bg-green-950/30 px-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="font-bold text-lg text-green-800 dark:text-green-200">{t("financials.profit_loss.net_profit")}</div>
                <div className="font-bold text-lg">
                  <Badge variant={netProfit >= 0 ? "default" : "destructive"} className="text-base px-3 py-1">
                    {formatCurrencyTable(netProfit)}
                  </Badge>
                </div>
              </div>

              {/* Net Profit Margin Analysis */}
              <div className="flex justify-between items-center py-3 bg-blue-50 dark:bg-blue-950/30 px-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="font-semibold text-blue-800 dark:text-blue-200">{t("financials.profit_loss.net_profit_margin")}</div>
                <div className="font-semibold">
                  <Badge variant={netProfitMargin >= 0 ? "default" : "destructive"} className="text-base px-3 py-1">
                    {netProfitMargin.toFixed(2)}%
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