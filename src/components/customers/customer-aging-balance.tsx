"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { CustomerBalanceAging } from "@/types/database"
import { useLocale } from "@/i18n/locale-provider"
import { Search } from "lucide-react"
import { formatCurrency as formatCurrencySAR } from '@/lib/formatting'

const formatCurrency = (amount: number) => {
  return formatCurrencySAR(amount)
}

interface CustomerAgingBalanceProps {
  selectedOwners?: string[]
}

export function CustomerAgingBalance({ selectedOwners = [] }: CustomerAgingBalanceProps) {
  const { t } = useLocale()
  const [customerData, setCustomerData] = React.useState<CustomerBalanceAging[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState<string>("")

  // Fetch customer data from Supabase
  React.useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('customer_balance_aging_filtered')
          .select('*')
          .order('total_balance', { ascending: false })

        if (error) throw error

        setCustomerData(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : t("pages.customers.error_loading_data"))
      } finally {
        setLoading(false)
      }
    }

    fetchCustomerData()
  }, [])

  const filteredData = React.useMemo(() => {
    // Filter out any records that might be totals or summaries
    let filtered = customerData.filter(customer =>
      customer.customer_name &&
      !customer.customer_name.toLowerCase().includes('total') &&
      !customer.customer_name.toLowerCase().includes('outstanding') &&
      customer.customer_id &&
      customer.customer_id.trim() !== ''
    )

    // Filter by selected owners
    if (selectedOwners && selectedOwners.length > 0) {
      filtered = filtered.filter(customer => selectedOwners.includes(customer.customer_owner_name_custom))
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(customer =>
        customer.customer_name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    }

    return filtered
  }, [customerData, selectedOwners, searchQuery])

  const totals = React.useMemo(() => {
    return filteredData.reduce(
      (acc, customer) => ({
        totalBalance: acc.totalBalance + customer.total_balance,
        current0_30: acc.current0_30 + customer.current_0_30,
        pastDue31_60: acc.pastDue31_60 + customer.past_due_31_60,
        pastDue61_90: acc.pastDue61_90 + customer.past_due_61_90,
        pastDue91_180: acc.pastDue91_180 + customer.past_due_91_180,
        pastDueOver180: acc.pastDueOver180 + customer.past_due_over_180,
      }),
      {
        totalBalance: 0,
        current0_30: 0,
        pastDue31_60: 0,
        pastDue61_90: 0,
        pastDue91_180: 0,
        pastDueOver180: 0,
      }
    )
  }, [filteredData])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("pages.customers.detailed_aging")}</CardTitle>
          <CardDescription>{t("pages.customers.loading_customer_data")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">{t("common.loading")}</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("pages.customers.detailed_aging")}</CardTitle>
          <CardDescription>{t("pages.customers.error_loading_data")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">{t("common.error")}: {error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{t("pages.customers.detailed_aging")}</CardTitle>
            <CardDescription>
              {t("pages.customers.description")}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground font-medium">{t("common.search")} {t("nav.customers")}:</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("pages.customers.search_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 min-h-[44px]"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="w-full max-w-full overflow-x-auto p-0 sm:p-6">
        {/* Mobile View */}
        <div className="md:hidden p-3 sm:p-4 w-full max-w-full">
          {filteredData.length > 0 && (
            <div className="p-3 sm:p-4 bg-accent/10 border-b-2 border-accent/30 space-y-2 mb-4 rounded-t-md w-full">
              <div className="font-bold text-sm text-foreground">{t("pages.customers.summary_totals")}</div>
              <div className="grid grid-cols-2 gap-3 text-xs w-full">
                <div>
                  <div className="text-muted-foreground">{t("pages.customers.total_balance")}</div>
                  <div className="font-medium break-all">{formatCurrency(totals.totalBalance)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">{t("pages.customers.current_0_30")}:</div>
                  <div className="font-medium break-all">{formatCurrency(totals.current0_30)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">{t("pages.customers.past_due_31_180")}:</div>
                  <div className="font-medium text-accent break-all">
                    {formatCurrency(totals.pastDue31_60 + totals.pastDue61_90 + totals.pastDue91_180)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">{t("pages.customers.high_risk_180_plus")}:</div>
                  <div className="font-medium text-red-600 dark:text-red-400 break-all">{formatCurrency(totals.pastDueOver180)}</div>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-3 w-full max-w-full">
            {filteredData.map((customer, index) => (
              <div key={`${customer.customer_id}-${index}`} className="bg-muted/50 dark:bg-muted/30 p-3 sm:p-4 rounded-lg space-y-3 border border-border w-full max-w-full overflow-hidden">
                <div className="space-y-2 w-full">
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-xs font-mono bg-muted/70 dark:bg-muted/50 text-foreground px-1.5 py-0.5 rounded flex-shrink-0">
                      #{index + 1}
                    </span>
                    <h4 className="font-bold text-base sm:text-lg text-foreground leading-tight flex-1 min-w-0 truncate">
                      {customer.customer_name}
                    </h4>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 w-full">
                    <div className="text-xs text-muted-foreground space-y-0.5 min-w-0 flex-1">
                      <div className="truncate">{t('common.owner')}: <span className="font-medium">{customer.customer_owner_name_custom || t('common.unknown')}</span></div>
                      <div className="truncate">{t('common.status')}: <span className="font-medium">{customer.customer_status}</span> • <span className="font-medium">{customer.total_invoices}</span> {t('common.invoices')}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-lg break-all">{formatCurrency(customer.total_balance)}</div>
                      <div className="text-xs text-muted-foreground">{t('pages.customers.total_balance')}</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs w-full">
                  <div className="min-w-0">
                    <div className="text-muted-foreground">{t('customers.table_headers.current_0_30')}:</div>
                    <div className="font-medium break-all">{formatCurrency(customer.current_0_30)}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-muted-foreground">{t('customers.table_headers.past_due_31_60')}:</div>
                    <div className="font-medium break-all">{formatCurrency(customer.past_due_31_60)}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-muted-foreground">{t('customers.table_headers.past_due_61_90')}:</div>
                    <div className="font-medium break-all">{formatCurrency(customer.past_due_61_90)}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-muted-foreground">{t('customers.table_headers.past_due_91_180')}:</div>
                    <div className="font-medium text-accent break-all">{formatCurrency(customer.past_due_91_180)}</div>
                  </div>
                </div>

                {customer.past_due_over_180 > 0 && (
                  <div className="pt-2 border-t border-red-200 dark:border-red-800 w-full">
                    <div className="flex justify-between items-center gap-2 w-full">
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium min-w-0 flex-1">{t('customers.table_headers.high_risk_180')}:</span>
                      <span className="font-bold text-red-600 dark:text-red-400 break-all flex-shrink-0">{formatCurrency(customer.past_due_over_180)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Desktop View */}
        <div className="hidden md:block w-full max-w-full">
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-b-2 border-border hover:bg-muted/70">
                <TableHead className="min-w-12 font-bold text-foreground py-4">S/N</TableHead>
                <TableHead className="min-w-48 font-bold text-foreground py-4">{t("customers.table_headers.customer_name")}</TableHead>
                <TableHead className="text-right min-w-32 font-bold text-foreground py-4">{t("pages.customers.total_balance")}</TableHead>
                <TableHead className="text-right min-w-28 font-bold text-foreground py-4">{t("customers.table_headers.current_0_30")}</TableHead>
                <TableHead className="text-right min-w-28 hidden lg:table-cell font-bold text-foreground py-4">{t("customers.table_headers.past_due_31_60")}</TableHead>
                <TableHead className="text-right min-w-28 hidden lg:table-cell font-bold text-foreground py-4">{t("customers.table_headers.past_due_61_90")}</TableHead>
                <TableHead className="text-right min-w-28 hidden lg:table-cell font-bold text-foreground py-4">{t("customers.table_headers.past_due_91_180")}</TableHead>
                <TableHead className="text-right min-w-28 font-bold text-foreground py-4">{t("customers.table_headers.high_risk_180")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((customer, index) => (
                <TableRow key={`${customer.customer_id}-${index}`} className="border-b border-border hover:bg-muted/50">
                  <TableCell className="text-center font-medium text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <div className="truncate max-w-48 text-foreground font-semibold">{customer.customer_name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {t('common.owner')}: {customer.customer_owner_name_custom || t('common.unknown')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('common.status')}: {customer.customer_status} • {t('common.invoices')}: {customer.total_invoices}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    {formatCurrency(customer.total_balance)}
                  </TableCell>
                  <TableCell className="text-right text-foreground">
                    {formatCurrency(customer.current_0_30)}
                  </TableCell>
                  <TableCell className="text-right hidden lg:table-cell text-foreground">
                    {formatCurrency(customer.past_due_31_60)}
                  </TableCell>
                  <TableCell className="text-right hidden lg:table-cell text-foreground">
                    {formatCurrency(customer.past_due_61_90)}
                  </TableCell>
                  <TableCell className="text-right text-accent hidden lg:table-cell font-medium">
                    {formatCurrency(customer.past_due_91_180)}
                  </TableCell>
                  <TableCell className="text-right text-red-600 dark:text-red-400 font-medium">
                    {formatCurrency(customer.past_due_over_180)}
                  </TableCell>
                </TableRow>
              ))}
              {filteredData.length > 0 && (
                <TableRow className="border-t-2 border-border bg-muted/50 font-semibold hover:bg-muted/70">
                  <TableCell></TableCell>
                  <TableCell className="font-bold text-foreground">{t("common.total")}</TableCell>
                  <TableCell className="text-right font-bold text-foreground">
                    {formatCurrency(totals.totalBalance)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground">
                    {formatCurrency(totals.current0_30)}
                  </TableCell>
                  <TableCell className="text-right font-bold hidden lg:table-cell text-foreground">
                    {formatCurrency(totals.pastDue31_60)}
                  </TableCell>
                  <TableCell className="text-right font-bold hidden lg:table-cell text-foreground">
                    {formatCurrency(totals.pastDue61_90)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-accent hidden lg:table-cell">
                    {formatCurrency(totals.pastDue91_180)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(totals.pastDueOver180)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            </Table>
          </div>
        </div>
        {filteredData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery.trim()
              ? `${t("pages.customers.no_customers_search")} "${searchQuery.trim()}"${selectedOwners && selectedOwners.length > 0 ? ` for selected owner(s)` : ""}.`
              : `${t("pages.customers.no_customers_found")}${selectedOwners && selectedOwners.length > 0 ? ` for selected owner(s)` : ""}.`
            }
          </div>
        )}
      </CardContent>
    </Card>
  )
}