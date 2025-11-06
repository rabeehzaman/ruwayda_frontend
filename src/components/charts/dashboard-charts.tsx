"use client"

import * as React from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Users, Package, Building2 } from "lucide-react"
import {
  useDailyRevenueTrend,
  useTopSellingProducts,
  useTopCustomers,
  useMonthlyRevenueComparison,
  useBranchPerformance,
  useProfitMarginDistribution,
  useWeeklyPerformance,
  useStockByWarehouse
} from "@/hooks/use-chart-data"
import { formatCurrency, formatNumber, formatDateSA } from "@/lib/formatting"
import type { DateRange } from "@/components/dashboard/date-filter"

interface ChartProps {
  dateRange?: DateRange
  branchFilter?: string
}

// Chart colors for consistent theming
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
  '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'
]

/**
 * Daily Revenue Trend Line Chart
 */
export function DailyRevenueTrendChart({ dateRange, branchFilter }: ChartProps) {
  const { data, loading, error } = useDailyRevenueTrend(dateRange, branchFilter)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Daily Revenue Trend
          </CardTitle>
          <CardDescription>Revenue and profit trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            {error || 'No data available'}
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map(item => ({
    ...item,
    date_key: formatDateSA(item.date_key),
    daily_revenue: Number(item.daily_revenue),
    daily_profit: Number(item.daily_profit)
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Daily Revenue Trend
        </CardTitle>
        <CardDescription>
          Revenue and profit trends over time ({data.length} days)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date_key" 
              fontSize={12}
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              fontSize={12}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name // Use the name directly from the Line component
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="daily_revenue" 
              stroke="#0088FE" 
              strokeWidth={2}
              name="Daily Revenue"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="daily_profit" 
              stroke="#00C49F" 
              strokeWidth={2}
              name="Daily Profit"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>Total Revenue: {formatCurrency(chartData.reduce((sum, item) => sum + item.daily_revenue, 0))}</span>
          <span>Total Profit: {formatCurrency(chartData.reduce((sum, item) => sum + item.daily_profit, 0))}</span>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Top Selling Products Bar Chart
 */
export function TopSellingProductsChart({ dateRange, branchFilter }: ChartProps) {
  const { data, loading, error } = useTopSellingProducts(dateRange, branchFilter, 10)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Top Selling Products
          </CardTitle>
          <CardDescription>Products ranked by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            {error || 'No data available'}
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map(item => ({
    ...item,
    product_name: item.product_name.length > 20 ? 
      item.product_name.substring(0, 20) + '...' : 
      item.product_name,
    total_revenue: Number(item.total_revenue),
    total_profit: Number(item.total_profit)
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Top Selling Products
        </CardTitle>
        <CardDescription>
          Products ranked by revenue (Top {data.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="product_name" 
              fontSize={10}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis 
              fontSize={12}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name // Use the name directly from the Bar component
              ]}
              labelFormatter={(label) => `Product: ${label}`}
            />
            <Legend />
            <Bar dataKey="total_revenue" fill="#0088FE" name="Product Revenue" />
            <Bar dataKey="total_profit" fill="#00C49F" name="Product Profit" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

/**
 * Top Customers Bar Chart
 */
export function TopCustomersChart({ dateRange, branchFilter }: ChartProps) {
  const { data, loading, error } = useTopCustomers(dateRange, branchFilter, 8)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Top Customers
          </CardTitle>
          <CardDescription>Customers ranked by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            {error || 'No data available'}
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map(item => ({
    ...item,
    customer_name: item.customer_name.length > 25 ? 
      item.customer_name.substring(0, 25) + '...' : 
      item.customer_name,
    total_revenue: Number(item.total_revenue),
    avg_order_value: Number(item.avg_order_value)
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Top Customers
        </CardTitle>
        <CardDescription>
          Customers ranked by revenue (Top {data.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="customer_name" 
              fontSize={10}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis 
              fontSize={12}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name // Use the name directly from the Bar component
              ]}
              labelFormatter={(label) => `Customer: ${label}`}
            />
            <Legend />
            <Bar dataKey="total_revenue" fill="#8884d8" name="Customer Revenue" />
            <Bar dataKey="avg_order_value" fill="#82ca9d" name="Average Order Value" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

/**
 * Monthly Revenue Comparison Line Chart
 */
export function MonthlyRevenueChart({ dateRange, branchFilter }: ChartProps) {
  const { data, loading, error } = useMonthlyRevenueComparison(dateRange, branchFilter)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Monthly Revenue Comparison
          </CardTitle>
          <CardDescription>Month-over-month performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            {error || 'No data available'}
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map(item => ({
    ...item,
    monthly_revenue: Number(item.monthly_revenue),
    monthly_profit: Number(item.monthly_profit),
    profit_margin_percent: Number(item.profit_margin_percent)
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Monthly Revenue Comparison
        </CardTitle>
        <CardDescription>
          Month-over-month performance ({data.length} months)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month_key" 
              fontSize={12}
            />
            <YAxis 
              fontSize={12}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name // Use the name directly from the Line component
              ]}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="monthly_revenue" 
              stroke="#0088FE" 
              strokeWidth={3}
              name="Monthly Revenue"
            />
            <Line 
              type="monotone" 
              dataKey="monthly_profit" 
              stroke="#00C49F" 
              strokeWidth={3}
              name="Monthly Profit"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
          <div className="text-center">
            <div className="font-semibold">Avg Monthly Revenue</div>
            <div className="text-muted-foreground">
              {formatCurrency(chartData.reduce((sum, item) => sum + item.monthly_revenue, 0) / chartData.length)}
            </div>
          </div>
          <div className="text-center">
            <div className="font-semibold">Avg Monthly Profit</div>
            <div className="text-muted-foreground">
              {formatCurrency(chartData.reduce((sum, item) => sum + item.monthly_profit, 0) / chartData.length)}
            </div>
          </div>
          <div className="text-center">
            <div className="font-semibold">Avg Profit Margin</div>
            <div className="text-muted-foreground">
              {(chartData.reduce((sum, item) => sum + item.profit_margin_percent, 0) / chartData.length).toFixed(1)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Branch Performance Bar Chart
 */
export function BranchPerformanceChart({ dateRange }: Omit<ChartProps, 'branchFilter'>) {
  const { data, loading, error } = useBranchPerformance(dateRange)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Branch Performance
          </CardTitle>
          <CardDescription>Performance comparison across branches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            {error || 'No data available'}
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map(item => ({
    ...item,
    total_revenue: Number(item.total_revenue),
    total_profit: Number(item.total_profit),
    avg_order_value: Number(item.avg_order_value)
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Branch Performance
        </CardTitle>
        <CardDescription>
          Performance comparison across branches ({data.length} branches)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="branch_name" 
              fontSize={11}
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              fontSize={12}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name // Use the name directly from the Bar component
              ]}
              labelFormatter={(label) => `Branch: ${label}`}
            />
            <Legend />
            <Bar dataKey="total_revenue" fill="#0088FE" name="Branch Revenue" />
            <Bar dataKey="total_profit" fill="#00C49F" name="Branch Profit" />
            <Bar dataKey="avg_order_value" fill="#FFBB28" name="Branch Avg Order Value" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

/**
 * Profit Margin Distribution Pie Chart
 */
export function ProfitMarginDistributionChart({ dateRange, branchFilter }: ChartProps) {
  const { data, loading, error } = useProfitMarginDistribution(dateRange, branchFilter, 'products')

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Profit Margin Distribution
          </CardTitle>
          <CardDescription>Product profit margins breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            {error || 'No data available'}
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((item, index) => ({
    ...item,
    total_revenue: Number(item.total_revenue),
    percentage_of_total: Number(item.percentage_of_total),
    fill: COLORS[index % COLORS.length]
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-4 w-4" />
          Profit Margin Distribution
        </CardTitle>
        <CardDescription>
          Product profit margins breakdown
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ margin_range, percentage_of_total }) => 
                `${margin_range}: ${percentage_of_total.toFixed(1)}%`
              }
              outerRadius={120}
              fill="#8884d8"
              dataKey="percentage_of_total"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          {chartData.map((item, index) => (
            <div key={item.margin_range} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded" 
                style={{ backgroundColor: item.fill }}
              />
              <span className="truncate">
                {item.margin_range}: {item.item_count} items
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Customer Profit Margin Distribution Pie Chart
 */
export function CustomerProfitMarginChart({ dateRange, branchFilter }: ChartProps) {
  const { data, loading, error } = useProfitMarginDistribution(dateRange, branchFilter, 'customers')

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Customer Profit Margins
          </CardTitle>
          <CardDescription>Customer profit margins breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            {error || 'No data available'}
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((item, index) => ({
    ...item,
    total_revenue: Number(item.total_revenue),
    percentage_of_total: Number(item.percentage_of_total),
    fill: COLORS[index % COLORS.length]
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-4 w-4" />
          Customer Profit Margins
        </CardTitle>
        <CardDescription>
          Customer profit margins breakdown
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ margin_range, percentage_of_total }) => 
                `${margin_range}: ${percentage_of_total.toFixed(1)}%`
              }
              outerRadius={120}
              fill="#8884d8"
              dataKey="percentage_of_total"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          {chartData.map((item, index) => (
            <div key={item.margin_range} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded" 
                style={{ backgroundColor: item.fill }}
              />
              <span className="truncate">
                {item.margin_range}: {item.item_count} customers
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Inventory Summary Card with Real Data
 */
export function InventorySummaryCard() {
  const { data: stockData, loading, error } = useStockByWarehouse()

  // Calculate summary stats
  const totalProducts = stockData?.reduce((sum, item) => sum + item.product_count, 0) || 0
  const totalStockValue = stockData?.reduce((sum, item) => sum + item.total_stock_value, 0) || 0
  const avgUnitCost = stockData && stockData.length > 0 ? 
    stockData.reduce((sum, item) => sum + item.avg_unit_cost, 0) / stockData.length : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Inventory Summary
        </CardTitle>
        <CardDescription>Current inventory status and insights</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center p-4 bg-muted/50 rounded-lg">
                <Skeleton className="h-8 w-20 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            ))}
          </div>
        ) : error || !stockData ? (
          <div className="text-center text-muted-foreground py-8">
            {error ? 'Failed to load inventory data' : 'No inventory data available'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {formatNumber(totalProducts)}
                </div>
                <div className="text-sm text-muted-foreground">Total Products</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalStockValue)}
                </div>
                <div className="text-sm text-muted-foreground">Total Stock Value</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(avgUnitCost)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Unit Cost</div>
              </div>
            </div>
            <div className="mt-6 text-center text-xs text-muted-foreground">
              <div>📊 Stock data across {stockData.length} warehouses</div>
              <div className="mt-1">🏪 Filter by warehouse in the Stock Report table for detailed analysis</div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Stock by Warehouse Pie Chart
 */
export function StockByWarehouseChart() {
  const { data, loading, error } = useStockByWarehouse()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Stock by Warehouse
          </CardTitle>
          <CardDescription>Stock value distribution across warehouses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            {error || 'No data available'}
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((item, index) => ({
    ...item,
    total_stock_value: Number(item.total_stock_value),
    fill: COLORS[index % COLORS.length]
  }))

  const totalValue = chartData.reduce((sum, item) => sum + item.total_stock_value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-4 w-4" />
          Stock by Warehouse
        </CardTitle>
        <CardDescription>
          Stock value distribution across warehouses (Total: {formatCurrency(totalValue)})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ warehouse_name, total_stock_value }) => 
                `${warehouse_name}: ${formatCurrency(total_stock_value)}`
              }
              outerRadius={120}
              fill="#8884d8"
              dataKey="total_stock_value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Stock Value']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-1 gap-2 mt-4 text-xs">
          {chartData.map((item, index) => (
            <div key={item.warehouse_name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: item.fill }}
                />
                <span className="truncate">{item.warehouse_name}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {item.product_count} products
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}