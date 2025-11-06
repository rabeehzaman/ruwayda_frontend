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
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight, MoreHorizontal, Database, Zap } from "lucide-react"
import { usePaginatedTransactions } from "@/hooks/use-profit-data"
import type { DateRange } from "@/components/dashboard/date-filter"

interface PaginatedDataTableProps {
  dateRange?: DateRange
  branchFilter?: string
  pageSize?: number
  title?: string
  description?: string
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

export function PaginatedDataTable({
  dateRange,
  branchFilter,
  pageSize = 50,
  title = "Transaction Data",
  description = "Paginated view of all transactions"
}: PaginatedDataTableProps) {
  const {
    data,
    loading,
    error,
    pagination,
    isOptimized,
    nextPage,
    prevPage,
    goToPage,
    refresh
  } = usePaginatedTransactions(pageSize, dateRange, branchFilter)

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

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A'
    return `${value.toFixed(2)}%`
  }

  const currentPage = Math.floor(pagination.currentOffset / pagination.pageSize)
  const totalPages = pagination.totalPages

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages - 1, start + maxVisible - 1)
    
    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1)
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  if (loading && data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <TableSkeleton />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-red-600 dark:text-red-400">
            Failed to load data: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {title}
              {isOptimized ? (
                <Zap className="h-4 w-4 text-green-500" />
              ) : (
                <Database className="h-4 w-4 text-yellow-500" />
              )}
            </CardTitle>
            <CardDescription>
              {description} • {pagination.totalCount.toLocaleString()} total records
              {isOptimized ? ' (Optimized)' : ' (Fallback)'}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
        </div>
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
                <TableHead>Margin %</TableHead>
                <TableHead>Branch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
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
                  <TableCell className="max-w-[200px] truncate" title={item['Item'] || 'N/A'}>
                    {item['Item'] || 'N/A'}
                  </TableCell>
                  <TableCell>{formatNumber(item['Qty'])}</TableCell>
                  <TableCell>{formatCurrency(item['Sale Price'])}</TableCell>
                  <TableCell>{formatCurrency(item['Cost'])}</TableCell>
                  <TableCell className={item['Profit'] && item['Profit'] >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(item['Profit'])}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item['Profit %'] && item['Profit %'] > 0 ? "default" : "destructive"}>
                      {formatPercentage(item['Profit %'])}
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
            {data.length === 0 && (
              <TableCaption>No data available for the selected criteria.</TableCaption>
            )}
          </Table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {pagination.currentOffset + 1} to{" "}
              {Math.min(pagination.currentOffset + pagination.pageSize, pagination.totalCount)} of{" "}
              {pagination.totalCount.toLocaleString()} results
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={currentPage === 0 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {getPageNumbers().map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    className="w-10"
                    onClick={() => goToPage(pageNum)}
                    disabled={loading}
                  >
                    {pageNum + 1}
                  </Button>
                ))}
                
                {totalPages > 5 && currentPage < totalPages - 3 && (
                  <>
                    <MoreHorizontal className="h-4 w-4" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-10"
                      onClick={() => goToPage(totalPages - 1)}
                      disabled={loading}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={!pagination.hasMore || loading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}