"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  DailyRevenueTrendChart,
  TopSellingProductsChart,
  TopCustomersChart,
  MonthlyRevenueChart,
  BranchPerformanceChart,
  ProfitMarginDistributionChart,
  CustomerProfitMarginChart,
  StockByWarehouseChart,
  InventorySummaryCard
} from "@/components/charts/dashboard-charts"
import { TrendingUp, BarChart3, PieChart, Users, Package, Building2, Warehouse } from "lucide-react"
import { useLocale } from "@/i18n/locale-provider"
import type { DateRange } from "./date-filter"

interface ChartsSectionProps {
  dateRange?: DateRange
  branchFilter?: string
}

export function ChartsSection({ dateRange, branchFilter }: ChartsSectionProps) {
  const { t } = useLocale()
  const [activeTab, setActiveTab] = React.useState("trends")

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader className="w-full max-w-full overflow-hidden px-3 sm:px-6">
        <CardTitle className="flex items-center gap-2 w-full max-w-full overflow-hidden">
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          <span className="truncate">{t("charts.title")}</span>
        </CardTitle>
        <CardDescription className="w-full max-w-full overflow-hidden">
          <span className="block truncate">{t("charts.subtitle")}</span>
          <div className="hidden sm:flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className="text-xs flex-shrink-0">
              {t("charts.badges.interactive")}
            </Badge>
            <Badge variant="outline" className="text-xs flex-shrink-0">
              {t("charts.badges.realtime")}
            </Badge>
            <Badge variant="outline" className="text-xs flex-shrink-0">
              {t("charts.badges.optimized")}
            </Badge>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="w-full max-w-full overflow-hidden px-3 sm:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="w-full overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 grid-rows-2 sm:grid-cols-4 sm:grid-rows-1 gap-1 min-h-[44px] h-auto max-w-full">
            <TabsTrigger value="trends" className="flex items-center justify-center gap-1 text-xs sm:text-sm min-h-[44px] px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground overflow-hidden">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">{t("charts.tabs.trends")}</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center justify-center gap-1 text-xs sm:text-sm min-h-[44px] px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground overflow-hidden">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">{t("charts.tabs.performance")}</span>
            </TabsTrigger>
            <TabsTrigger value="distribution" className="flex items-center justify-center gap-1 text-xs sm:text-sm min-h-[44px] px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground overflow-hidden">
              <PieChart className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">{t("charts.tabs.distribution")}</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center justify-center gap-1 text-xs sm:text-sm min-h-[44px] px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground overflow-hidden">
              <Warehouse className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">{t("charts.tabs.inventory")}</span>
            </TabsTrigger>
          </TabsList>
          </div>

          <TabsContent value="trends" className="space-y-6 mt-6">
            <div className="grid gap-6">
              <DailyRevenueTrendChart dateRange={dateRange} branchFilter={branchFilter} />
              <MonthlyRevenueChart dateRange={dateRange} branchFilter={branchFilter} />
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6 mt-6">
            <div className="grid gap-6">
              <BranchPerformanceChart dateRange={dateRange} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopSellingProductsChart dateRange={dateRange} branchFilter={branchFilter} />
                <TopCustomersChart dateRange={dateRange} branchFilter={branchFilter} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-6 mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <ProfitMarginDistributionChart dateRange={dateRange} branchFilter={branchFilter} />
              <CustomerProfitMarginChart dateRange={dateRange} branchFilter={branchFilter} />
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6 mt-6">
            <div className="grid gap-6">
              <StockByWarehouseChart />
              <InventorySummaryCard />
            </div>
          </TabsContent>
        </Tabs>

        {/* Chart Information Footer */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <div className="text-sm text-muted-foreground">
            <div className="font-medium mb-2">{t("charts.info.title")}</div>
            <ul className="space-y-1 text-xs">
              <li>• {t("charts.info.performance_note")}</li>
              <li>• {t("charts.info.filter_note")}</li>
              <li>• {t("charts.info.refresh_note")}</li>
              <li>• {t("charts.info.hover_note")}</li>
              <li>• {t("charts.info.responsive_note")}</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}