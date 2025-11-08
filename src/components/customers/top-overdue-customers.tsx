"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useTopOverdueCustomers } from "@/hooks/use-customer-aging-kpis"
import { useLocale } from "@/i18n/locale-provider"
import { 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Users
} from "lucide-react"

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('SAR', 'SAR ')
}

const getRiskBadgeVariant = (riskCategory: string) => {
  switch (riskCategory) {
    case 'Current':
      return 'default'
    case 'Low Risk':
      return 'secondary'
    case 'Medium Risk':
      return 'outline'
    case 'High Risk':
      return 'destructive'
    case 'Very High Risk':
      return 'destructive'
    default:
      return 'secondary'
  }
}

const getPriorityIcon = (priority: number) => {
  if (priority >= 5) return <AlertTriangle className="h-4 w-4 text-destructive" />
  if (priority >= 4) return <TrendingUp className="h-4 w-4 text-warning" />
  if (priority >= 3) return <Clock className="h-4 w-4 text-accent" />
  return <Users className="h-4 w-4 text-blue-500" />
}

function CustomerSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border-b last:border-b-0 gap-3">
      <div className="flex-1">
        <Skeleton className="h-4 w-32 sm:w-48 mb-2" />
        <Skeleton className="h-3 w-24 sm:w-32 mb-1" />
        <Skeleton className="h-3 w-20 sm:w-24" />
      </div>
      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
        <Skeleton className="h-5 w-16 sm:w-20 sm:mb-2" />
        <Skeleton className="h-4 w-14 sm:w-16" />
      </div>
    </div>
  )
}

interface TopOverdueCustomersProps {
  selectedOwners?: string[]
}

export function TopOverdueCustomers({ selectedOwners }: TopOverdueCustomersProps) {
  const { t } = useLocale()
  const { data: allData, loading, error } = useTopOverdueCustomers(50)

  // Filter data by selected owners
  const data = React.useMemo(() => {
    if (!allData || !selectedOwners || selectedOwners.length === 0) {
      return allData?.slice(0, 10) || []
    }
    return allData.filter(customer => selectedOwners.includes(customer.sales_person)).slice(0, 10)
  }, [allData, selectedOwners])

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">{t("customers.charts.error_loading_data")}</CardTitle>
          <CardDescription>{t("customers.messages.failed_to_load_overdue")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-start gap-2 text-base sm:text-lg">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
          <span className="leading-tight">{t("customers.charts.top_overdue_customers")}</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm mt-1.5 leading-relaxed">
          {t("pages.customers.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div>
            {[...Array(5)].map((_, i) => (
              <CustomerSkeleton key={i} />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">{t("customers.charts.no_overdue_customers")}</p>
          </div>
        ) : (
          <div className="max-h-[400px] sm:max-h-96 overflow-y-auto">
            {data.map((customer, index) => (
              <div
                key={`${customer.customer_id}-${index}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors gap-3"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{index + 1}
                    </span>
                    {getPriorityIcon(customer.collection_priority)}
                    <h4 className="font-medium truncate text-sm sm:text-base">
                      {customer.customer_name}
                    </h4>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant={getRiskBadgeVariant(customer.risk_category)} className="text-xs">
                      {customer.risk_category}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate">
                      {customer.oldest_aging_bucket}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">
                      💼 {customer.sales_person || t('common.unassigned')}
                    </span>
                    <span className="whitespace-nowrap">
                      📄 {customer.total_invoices} {t('common.invoices')}
                    </span>
                    {customer.days_since_last_invoice !== null && (
                      <span className="whitespace-nowrap">
                        ⏰ {customer.days_since_last_invoice} {t('common.days_ago')}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-0 sm:text-right sm:ml-4 flex-shrink-0">
                  <div className="font-bold text-sm sm:text-lg order-2 sm:order-1">
                    {formatCurrency(customer.outstanding_amount)}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap order-1 sm:order-2 sm:mt-1">
                    {t('common.priority')} {customer.collection_priority}/5
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!loading && data.length > 0 && (
          <div className="p-3 sm:p-4 border-t bg-muted/30">
            <div className="flex flex-col sm:flex-row justify-between gap-2 text-xs sm:text-sm">
              <span className="text-muted-foreground">
                {t("pages.customers.total_shown")} {data.length} {t("customers.table_headers.customers")}
              </span>
              <span className="font-medium">
                {t('common.combined')}: {formatCurrency(
                  data.reduce((sum, customer) => sum + customer.outstanding_amount, 0)
                )}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}