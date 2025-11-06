"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Search, Package, Users, FileText, Warehouse } from "lucide-react"
import { useProfitAnalysisData } from "@/hooks/use-profit-data"
import { fetchStockSummaryData, type StockSummary } from "@/lib/data-fetching"
import { formatCurrencyTable, formatNumber, formatDateSA, parseDate } from "@/lib/formatting"
import type { DateRange } from "./date-filter"
// Removed unused import

interface TabbedTablesProps {
  dateRange?: DateRange
  branchFilter?: string
}

export function TabbedTables({ dateRange, branchFilter }: TabbedTablesProps) {
  const { data: profitData, loading } = useProfitAnalysisData(dateRange, branchFilter)
  const [stockData, setStockData] = React.useState<StockSummary[]>([])
  const [stockLoading, setStockLoading] = React.useState(true)
  
  // Search states for each tab
  const [itemSearch, setItemSearch] = React.useState("")
  const [customerSearch, setCustomerSearch] = React.useState("")
  const [invoiceSearch, setInvoiceSearch] = React.useState("")
  const [stockSearch, setStockSearch] = React.useState("")

  // Pagination states for each tab
  const [itemCurrentPage, setItemCurrentPage] = React.useState(1)
  const [customerCurrentPage, setCustomerCurrentPage] = React.useState(1)
  const [invoiceCurrentPage, setInvoiceCurrentPage] = React.useState(1)
  const [stockCurrentPage, setStockCurrentPage] = React.useState(1)
  const itemsPerPage = 25

  // Load stock data
  React.useEffect(() => {
    async function loadStockData() {
      try {
        setStockLoading(true)
        const data = await fetchStockSummaryData()
        setStockData(data)
      } catch (error) {
        console.error('Error loading stock data:', error)
      } finally {
        setStockLoading(false)
      }
    }
    loadStockData()
  }, [])

  // Process data for different tables
  const profitByItem = React.useMemo(() => {
    if (!profitData) return []
    
    return profitData
      .filter(item => {
        const matchesItem = !itemSearch || item.Item?.toLowerCase().includes(itemSearch.toLowerCase())
        const matchesCustomer = !itemSearch || item['Customer Name']?.toLowerCase().includes(itemSearch.toLowerCase())
        const matchesInvoice = !itemSearch || item['Inv No']?.toLowerCase().includes(itemSearch.toLowerCase())
        return matchesItem || matchesCustomer || matchesInvoice
      })
      .map(item => ({
        date: item['Inv Date'] || '',
        invoiceNo: item['Inv No'] || '',
        customer: item['Customer Name'] || '',
        item: item.Item || '',
        unitPrice: item['Unit Price'] || 0,
        unitCost: item['Unit Cost'] || 0,
        unitProfit: item['Unit Profit'] || 0,
        profitPercent: item['Profit %'] || 0
      }))
      .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())
  }, [profitData, itemSearch])

  // Reset pagination when search changes
  React.useEffect(() => {
    setItemCurrentPage(1)
  }, [itemSearch])

  React.useEffect(() => {
    setCustomerCurrentPage(1)
  }, [customerSearch])

  React.useEffect(() => {
    setInvoiceCurrentPage(1)
  }, [invoiceSearch])

  React.useEffect(() => {
    setStockCurrentPage(1)
  }, [stockSearch])

  const profitByCustomer = React.useMemo(() => {
    if (!profitData) return []
    
    const customerProfits = profitData.reduce((acc, item) => {
      const customer = item['Customer Name'] || 'Unknown'
      if (!acc[customer]) {
        acc[customer] = 0
      }
      acc[customer] += item.Profit || 0
      return acc
    }, {} as Record<string, number>)

    return Object.entries(customerProfits)
      .filter(([customer]) => 
        !customerSearch || customer.toLowerCase().includes(customerSearch.toLowerCase())
      )
      .map(([customer, profit]) => ({ customer, profit }))
      .sort((a, b) => b.profit - a.profit)
  }, [profitData, customerSearch])

  const profitByInvoice = React.useMemo(() => {
    if (!profitData) return []

    interface InvoiceProfit {
      date: string
      invoiceNo: string
      customer: string
      salePrice: number
      cost: number
      profit: number
    }

    const invoiceProfits = profitData.reduce((acc, item) => {
      const invoiceNo = item['Inv No'] || ''
      if (!acc[invoiceNo]) {
        acc[invoiceNo] = {
          date: item['Inv Date'] || '',
          invoiceNo,
          customer: item['Customer Name'] || '',
          salePrice: 0,
          cost: 0,
          profit: 0
        }
      }
      // Use Sale Price (without VAT) for taxable sales
      acc[invoiceNo].salePrice += item['Sale Price'] || 0
      acc[invoiceNo].cost += item.Cost || 0
      acc[invoiceNo].profit += item.Profit || 0
      return acc
    }, {} as Record<string, InvoiceProfit>)

    return Object.values(invoiceProfits)
      .filter((invoice: InvoiceProfit) => {
        const matchesCustomer = !invoiceSearch || invoice.customer?.toLowerCase().includes(invoiceSearch.toLowerCase())
        const matchesInvoice = !invoiceSearch || invoice.invoiceNo?.toLowerCase().includes(invoiceSearch.toLowerCase())
        return matchesCustomer || matchesInvoice
      })
      .map((invoice: InvoiceProfit) => ({
        ...invoice,
        profitPercent: invoice.salePrice > 0 ? (invoice.profit / invoice.salePrice) * 100 : 0
      }))
      .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())
  }, [profitData, invoiceSearch])

  const stockReport = React.useMemo(() => {
    return stockData
      .filter(item => 
        !stockSearch || item.Name?.toLowerCase().includes(stockSearch.toLowerCase())
      )
      .map(item => ({
        name: item.Name || '',
        stock: item['Stock Qty'] || 0,
        unitCost: item['Current Stock Value'] && item['Stock Qty'] 
          ? (item['Current Stock Value'] / item['Stock Qty']) || 0 
          : 0,
        totalCost: item['Current Stock Value'] || 0,
        totalCostWithVAT: item['Stock Value with VAT'] || 0
      }))
  }, [stockData, stockSearch])

  // Paginated data
  const paginatedProfitByItem = React.useMemo(() => {
    const startIndex = (itemCurrentPage - 1) * itemsPerPage
    return profitByItem.slice(startIndex, startIndex + itemsPerPage)
  }, [profitByItem, itemCurrentPage, itemsPerPage])

  const paginatedProfitByCustomer = React.useMemo(() => {
    const startIndex = (customerCurrentPage - 1) * itemsPerPage
    return profitByCustomer.slice(startIndex, startIndex + itemsPerPage)
  }, [profitByCustomer, customerCurrentPage, itemsPerPage])

  const paginatedProfitByInvoice = React.useMemo(() => {
    const startIndex = (invoiceCurrentPage - 1) * itemsPerPage
    return profitByInvoice.slice(startIndex, startIndex + itemsPerPage)
  }, [profitByInvoice, invoiceCurrentPage, itemsPerPage])

  const paginatedStockReport = React.useMemo(() => {
    const startIndex = (stockCurrentPage - 1) * itemsPerPage
    return stockReport.slice(startIndex, startIndex + itemsPerPage)
  }, [stockReport, stockCurrentPage, itemsPerPage])

  // Total pages for each table
  const itemTotalPages = Math.ceil(profitByItem.length / itemsPerPage)
  const customerTotalPages = Math.ceil(profitByCustomer.length / itemsPerPage)
  const invoiceTotalPages = Math.ceil(profitByInvoice.length / itemsPerPage)
  const stockTotalPages = Math.ceil(stockReport.length / itemsPerPage)

  // Calculate totals
  const customerTotal = profitByCustomer.reduce((sum, item) => sum + item.profit, 0)
  const invoiceTotal = {
    salePrice: profitByInvoice.reduce((sum, item) => sum + item.salePrice, 0),
    cost: profitByInvoice.reduce((sum, item) => sum + item.cost, 0),
    profit: profitByInvoice.reduce((sum, item) => sum + item.profit, 0)
  }
  const stockTotal = {
    stock: stockReport.reduce((sum, item) => sum + item.stock, 0),
    totalCost: stockReport.reduce((sum, item) => sum + item.totalCost, 0),
    totalCostWithVAT: stockReport.reduce((sum, item) => sum + item.totalCostWithVAT, 0)
  }

  if (loading || stockLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Tables...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            Loading data...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Analysis</CardTitle>
        <CardDescription>Switch between different analysis views</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="items" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Package className="h-4 w-4" />
              Profit by Item
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4" />
              Profit by Customer
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4" />
              Profit by Invoice
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Warehouse className="h-4 w-4" />
              Stock Report
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by item, customer, or invoice..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">U.Price</TableHead>
                    <TableHead className="text-right">U.Cost</TableHead>
                    <TableHead className="text-right">Unit Profit</TableHead>
                    <TableHead className="text-right">Profit %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProfitByItem.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDateSA(item.date)}</TableCell>
                      <TableCell>{item.invoiceNo}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.item}</TableCell>
                      <TableCell className="text-right">{formatCurrencyTable(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrencyTable(item.unitCost)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.unitProfit >= 0 ? "default" : "destructive"}>
                          {formatCurrencyTable(item.unitProfit)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.profitPercent >= 0 ? "default" : "destructive"}>
                          {item.profitPercent.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {itemTotalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  {itemCurrentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious href="#" className="hover:bg-primary hover:text-primary-foreground" onClick={(e) => { e.preventDefault(); setItemCurrentPage(itemCurrentPage - 1) }} />
                    </PaginationItem>
                  )}
                  {Array.from({ length: Math.min(itemTotalPages, 10) }, (_, i) => {
                    const startPage = Math.max(1, itemCurrentPage - 5)
                    const page = startPage + i
                    if (page > itemTotalPages) return null
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink 
                          href="#" 
                          isActive={page === itemCurrentPage}
                          className={page === itemCurrentPage ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-primary hover:text-primary-foreground"}
                          onClick={(e) => { e.preventDefault(); setItemCurrentPage(page) }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  }).filter(Boolean)}
                  {itemCurrentPage < itemTotalPages && (
                    <PaginationItem>
                      <PaginationNext href="#" className="hover:bg-primary hover:text-primary-foreground" onClick={(e) => { e.preventDefault(); setItemCurrentPage(itemCurrentPage + 1) }} />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            )}
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="bg-muted font-semibold">Total:</TableHead>
                    <TableHead className="bg-muted font-semibold text-right">
                      {formatCurrencyTable(customerTotal)}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProfitByCustomer.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.customer}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.profit >= 0 ? "default" : "destructive"}>
                          {formatCurrencyTable(item.profit)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {customerTotalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  {customerCurrentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious href="#" className="hover:bg-primary hover:text-primary-foreground" onClick={(e) => { e.preventDefault(); setCustomerCurrentPage(customerCurrentPage - 1) }} />
                    </PaginationItem>
                  )}
                  {Array.from({ length: Math.min(customerTotalPages, 10) }, (_, i) => {
                    const startPage = Math.max(1, customerCurrentPage - 5)
                    const page = startPage + i
                    if (page > customerTotalPages) return null
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink 
                          href="#" 
                          isActive={page === customerCurrentPage}
                          className={page === customerCurrentPage ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-primary hover:text-primary-foreground"}
                          onClick={(e) => { e.preventDefault(); setCustomerCurrentPage(page) }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  }).filter(Boolean)}
                  {customerCurrentPage < customerTotalPages && (
                    <PaginationItem>
                      <PaginationNext href="#" className="hover:bg-primary hover:text-primary-foreground" onClick={(e) => { e.preventDefault(); setCustomerCurrentPage(customerCurrentPage + 1) }} />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer or invoice number..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead className="text-right">Sale Price</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Profit %</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead colSpan={2} className="bg-muted font-semibold">Total:</TableHead>
                    <TableHead className="bg-muted font-semibold text-right">
                      {formatCurrencyTable(invoiceTotal.salePrice)}
                    </TableHead>
                    <TableHead className="bg-muted font-semibold text-right">
                      {formatCurrencyTable(invoiceTotal.cost)}
                    </TableHead>
                    <TableHead className="bg-muted font-semibold text-right">
                      {formatCurrencyTable(invoiceTotal.profit)}
                    </TableHead>
                    <TableHead className="bg-muted font-semibold text-right">
                      {invoiceTotal.salePrice > 0 ? ((invoiceTotal.profit / invoiceTotal.salePrice) * 100).toFixed(1) : 0}%
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProfitByInvoice.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDateSA(item.date)}</TableCell>
                      <TableCell>{item.invoiceNo}</TableCell>
                      <TableCell className="text-right">{formatCurrencyTable(item.salePrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrencyTable(item.cost)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.profit >= 0 ? "default" : "destructive"}>
                          {formatCurrencyTable(item.profit)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.profitPercent >= 0 ? "default" : "destructive"}>
                          {item.profitPercent.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {invoiceTotalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  {invoiceCurrentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious href="#" className="hover:bg-primary hover:text-primary-foreground" onClick={(e) => { e.preventDefault(); setInvoiceCurrentPage(invoiceCurrentPage - 1) }} />
                    </PaginationItem>
                  )}
                  {Array.from({ length: Math.min(invoiceTotalPages, 10) }, (_, i) => {
                    const startPage = Math.max(1, invoiceCurrentPage - 5)
                    const page = startPage + i
                    if (page > invoiceTotalPages) return null
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink 
                          href="#" 
                          isActive={page === invoiceCurrentPage}
                          className={page === invoiceCurrentPage ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-primary hover:text-primary-foreground"}
                          onClick={(e) => { e.preventDefault(); setInvoiceCurrentPage(page) }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  }).filter(Boolean)}
                  {invoiceCurrentPage < invoiceTotalPages && (
                    <PaginationItem>
                      <PaginationNext href="#" className="hover:bg-primary hover:text-primary-foreground" onClick={(e) => { e.preventDefault(); setInvoiceCurrentPage(invoiceCurrentPage + 1) }} />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            )}
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product name..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Total Cost with VAT</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="bg-muted font-semibold">Total:</TableHead>
                    <TableHead className="bg-muted font-semibold text-right">
                      {formatNumber(stockTotal.stock)}
                    </TableHead>
                    <TableHead className="bg-muted font-semibold text-right">-</TableHead>
                    <TableHead className="bg-muted font-semibold text-right">
                      {formatCurrencyTable(stockTotal.totalCost)}
                    </TableHead>
                    <TableHead className="bg-muted font-semibold text-right">
                      {formatCurrencyTable(stockTotal.totalCostWithVAT)}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStockReport.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="max-w-[300px] truncate">{item.name}</TableCell>
                      <TableCell className="text-right">{formatNumber(item.stock)}</TableCell>
                      <TableCell className="text-right">{formatCurrencyTable(item.unitCost)}</TableCell>
                      <TableCell className="text-right">{formatCurrencyTable(item.totalCost)}</TableCell>
                      <TableCell className="text-right">{formatCurrencyTable(item.totalCostWithVAT)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {stockTotalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  {stockCurrentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious href="#" className="hover:bg-primary hover:text-primary-foreground" onClick={(e) => { e.preventDefault(); setStockCurrentPage(stockCurrentPage - 1) }} />
                    </PaginationItem>
                  )}
                  {Array.from({ length: Math.min(stockTotalPages, 10) }, (_, i) => {
                    const startPage = Math.max(1, stockCurrentPage - 5)
                    const page = startPage + i
                    if (page > stockTotalPages) return null
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink 
                          href="#" 
                          isActive={page === stockCurrentPage}
                          className={page === stockCurrentPage ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-primary hover:text-primary-foreground"}
                          onClick={(e) => { e.preventDefault(); setStockCurrentPage(page) }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  }).filter(Boolean)}
                  {stockCurrentPage < stockTotalPages && (
                    <PaginationItem>
                      <PaginationNext href="#" className="hover:bg-primary hover:text-primary-foreground" onClick={(e) => { e.preventDefault(); setStockCurrentPage(stockCurrentPage + 1) }} />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}