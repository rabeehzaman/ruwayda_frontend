"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useBranchPerformance } from "@/hooks/use-customer-aging-kpis"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { 
  Building2, 
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from "lucide-react"

const formatCurrency = (amount: string) => {
  const numAmount = parseFloat(amount)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount).replace('SAR', 'SAR ')
}

const getPerformanceBadge = (overduePercentage: string) => {
  const percentage = parseFloat(overduePercentage)
  if (percentage <= 5) return { variant: 'default' as const, text: 'Excellent', icon: TrendingUp }
  if (percentage <= 15) return { variant: 'secondary' as const, text: 'Good', icon: TrendingUp }
  if (percentage <= 30) return { variant: 'outline' as const, text: 'Fair', icon: TrendingDown }
  return { variant: 'destructive' as const, text: 'Poor', icon: TrendingDown }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: {
      branch_name: string
      total_receivables: string
      overdue_percentage: string
      customers_with_balance: number
    }
  }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium">{label}</p>
        <p className="text-sm">
          <span className="text-muted-foreground">Receivables: </span>
          {formatCurrency(data.total_receivables)}
        </p>
        <p className="text-sm">
          <span className="text-muted-foreground">Overdue: </span>
          {data.overdue_percentage}%
        </p>
        <p className="text-sm">
          <span className="text-muted-foreground">Customers: </span>
          {data.customers_with_balance}
        </p>
      </div>
    )
  }
  return null
}

function BranchSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-5" />
        <div>
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="text-right">
        <Skeleton className="h-4 w-20 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

export function BranchPerformance() {
  const { data, loading, error } = useBranchPerformance()

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Data</CardTitle>
          <CardDescription>Failed to load branch performance data</CardDescription>
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Branch Performance
          </CardTitle>
          <CardDescription>Receivables and collection performance by branch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full mb-6">
            <Skeleton className="w-full h-full" />
          </div>
          <div>
            {[...Array(4)].map((_, i) => (
              <BranchSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Branch Performance
          </CardTitle>
          <CardDescription>Receivables and collection performance by branch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No branch performance data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Prepare chart data
  const chartData = data.map(branch => ({
    ...branch,
    receivables_value: parseFloat(branch.total_receivables),
    overdue_percent: parseFloat(branch.overdue_percentage)
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Branch Performance
        </CardTitle>
        <CardDescription>
          Receivables and collection performance by branch
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        <div className="h-64 w-full mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="branch_name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                className="fill-muted-foreground"
              />
              <YAxis 
                fontSize={12}
                className="fill-muted-foreground"
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="receivables_value" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Branch Details */}
        <div className="space-y-0 border rounded-lg">
          {data.map((branch) => {
            const performanceBadge = getPerformanceBadge(branch.overdue_percentage)
            const PerformanceIcon = performanceBadge.icon
            
            return (
              <div 
                key={branch.branch_name} 
                className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{branch.receivables_rank}
                    </span>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div>
                    <div className="font-medium">{branch.branch_name}</div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>👥 {branch.customers_with_balance} customers</span>
                      <span>📄 {branch.outstanding_invoices} invoices</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold">
                      {formatCurrency(branch.total_receivables)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {branch.overdue_percentage}% overdue
                    </div>
                  </div>
                  
                  <Badge variant={performanceBadge.variant} className="gap-1">
                    <PerformanceIcon className="h-3 w-3" />
                    {performanceBadge.text}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Branches:</span>
              <span className="ml-2 font-medium">{data.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Best Performer:</span>
              <span className="ml-2 font-medium text-green-600">
                {data.find(b => b.performance_rank === 1)?.branch_name || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Customers:</span>
              <span className="ml-2 font-medium">
                {data.reduce((sum, branch) => sum + branch.customers_with_balance, 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Combined Receivables:</span>
              <span className="ml-2 font-medium">
                {formatCurrency(
                  data.reduce((sum, branch) => sum + parseFloat(branch.total_receivables), 0).toString()
                )}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}