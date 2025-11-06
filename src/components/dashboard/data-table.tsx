"use client"

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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useProfitAnalysisData } from "@/hooks/use-profit-data"

function TableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function ProfitAnalysisTable() {
  const { data, loading, error } = useProfitAnalysisData()

  if (loading) return <TableSkeleton />

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profit Analysis Data</CardTitle>
          <CardDescription>Recent profit analysis records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-red-600 dark:text-red-400">
            Failed to load data
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A'
    return `${value.toFixed(1)}%`
  }

  const getGrowthBadge = (value: number | null | undefined) => {
    if (value === null || value === undefined) return null
    
    if (value > 0) {
      return (
        <Badge variant="secondary" className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400">
          +{value.toFixed(1)}%
        </Badge>
      )
    } else if (value < 0) {
      return (
        <Badge variant="secondary" className="text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400">
          {value.toFixed(1)}%
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary" className="text-muted-foreground">
          0%
        </Badge>
      )
    }
  }

  const limitedData = data.slice(0, 10) // Show only last 10 records

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit Analysis Data</CardTitle>
        <CardDescription>Recent profit analysis records</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice Date</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Profit</TableHead>
              <TableHead>Margin %</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Branch</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {limitedData.map((item, index) => (
              <TableRow key={item['Inv No'] || index}>
                <TableCell className="font-medium">
                  {item['Inv Date'] 
                    ? new Date(item['Inv Date']).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric' 
                      })
                    : 'N/A'
                  }
                </TableCell>
                <TableCell>{formatCurrency(item['SaleWithVAT'])}</TableCell>
                <TableCell>{formatCurrency(item['Profit'])}</TableCell>
                <TableCell>{formatPercentage(item['Profit %'])}</TableCell>
                <TableCell>
                  <Badge variant={item['Profit %'] && item['Profit %'] > 0 ? "default" : "destructive"}>
                    {item['Profit %'] ? `${item['Profit %'].toFixed(1)}%` : '0%'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {item['Branch Name'] || 'N/A'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {limitedData.length === 0 && (
            <TableCaption>No data available.</TableCaption>
          )}
        </Table>
      </CardContent>
    </Card>
  )
}

export function DetailedDataTable() {
  const { data, loading, error } = useProfitAnalysisData()

  if (loading) return <TableSkeleton />

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analysis</CardTitle>
          <CardDescription>Comprehensive profit and cost breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-red-600 dark:text-red-400">
            Failed to load data
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US').format(value)
  }

  const limitedData = data.slice(0, 5) // Show only last 5 records for detailed view

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Analysis</CardTitle>
        <CardDescription>Comprehensive profit and cost breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Sale Price</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Salesperson</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {limitedData.map((item, index) => (
                <TableRow key={item['Inv No'] || index}>
                  <TableCell className="font-medium">
                    {item['Inv No'] || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {item['Inv Date'] 
                      ? new Date(item['Inv Date']).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric' 
                        })
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{item['Item'] || 'N/A'}</TableCell>
                  <TableCell>{formatNumber(item['Qty'])}</TableCell>
                  <TableCell>{formatCurrency(item['Sale Price'])}</TableCell>
                  <TableCell>{formatCurrency(item['Cost'])}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(item['Profit'])}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{item['Customer Name'] || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item['Sales Person Name'] || 'N/A'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            {limitedData.length === 0 && (
              <TableCaption>No data available.</TableCaption>
            )}
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}