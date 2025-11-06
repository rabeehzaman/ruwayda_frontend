// =============================================================================
// CSV EXPORT UTILITIES
// =============================================================================
// Functions for exporting invoice data and invoice items to CSV format
// Includes branch information and proper CSV formatting
// =============================================================================

import { formatCurrencyTable, formatNumber, formatDateSA } from './formatting'
import type { OptimizedInvoice } from './database-optimized'
import { exportInvoicesForCSV, exportInvoicesWithItemsForCSV } from './database-optimized'

export interface InvoiceItem {
  item_name: string
  quantity: number
  unit_price: number
  sale_price: number
  unit_cost: number
  cost: number
  unit_profit: number
  profit: number
  profit_percentage: number
}

// =============================================================================
// CSV FORMATTING UTILITIES
// =============================================================================

/**
 * Escape CSV field content to handle commas, quotes, and newlines
 */
function escapeCSVField(field: unknown): string {
  if (field === null || field === undefined) return ''
  
  const stringField = String(field)
  
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`
  }
  
  return stringField
}

/**
 * Convert array of data to CSV string
 */
function arrayToCSV(data: string[][]): string {
  return data.map(row => row.map(escapeCSVField).join(',')).join('\n')
}

/**
 * Download CSV file with given content and filename
 */
function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

// =============================================================================
// INVOICE CSV EXPORT FUNCTIONS
// =============================================================================

/**
 * Export all invoices to CSV format
 */
export function exportInvoicesToCSV(
  invoices: OptimizedInvoice[],
  filename?: string
): void {
  if (!invoices || invoices.length === 0) {
    console.warn('No invoice data to export')
    return
  }

  const headers = [
    'Inv Date',
    'Inv No',
    'Customer Name',
    'Branch',
    'Sale Price',
    'Cost', 
    'Profit',
    'Profit %'
  ]

  const csvData: string[][] = [headers]

  invoices.forEach(invoice => {
    const profitPercentage = invoice.total_sale_price > 0 
      ? ((invoice.total_profit / invoice.total_sale_price) * 100).toFixed(2)
      : '0.00'

    csvData.push([
      formatDateSA(invoice.inv_date),
      invoice.invoice_no,
      invoice.customer_name || 'Unknown Customer',
      invoice.branch_name || 'Unknown Branch',
      formatCurrencyTable(invoice.total_sale_price || 0).replace(/[,\s]/g, ''), // Remove formatting for CSV
      formatCurrencyTable(invoice.total_cost || 0).replace(/[,\s]/g, ''),
      formatCurrencyTable(invoice.total_profit || 0).replace(/[,\s]/g, ''),
      `${profitPercentage}%`
    ])
  })

  const csvContent = arrayToCSV(csvData)
  const defaultFilename = `invoices_${new Date().toISOString().slice(0, 16).replace(/:/g, '-')}.csv`
  
  downloadCSV(csvContent, filename || defaultFilename)
}

/**
 * Export single invoice with its items to CSV format
 */
export function exportSingleInvoiceWithItemsToCSV(
  invoice: OptimizedInvoice,
  items: InvoiceItem[],
  filename?: string
): void {
  if (!invoice) {
    console.warn('No invoice data to export')
    return
  }

  // Invoice summary headers
  const summaryHeaders = [
    'Inv Date',
    'Inv No',
    'Item',
    'Branch',
    'Customer',
    'Qty',
    'Cost',
    'Profit',
    'Sale Price',
    'Profit %'
  ]

  const csvData: string[][] = [summaryHeaders]

  // Add invoice summary row
  const invoiceProfitPercentage = invoice.total_sale_price > 0 
    ? ((invoice.total_profit / invoice.total_sale_price) * 100).toFixed(2)
    : '0.00'

  csvData.push([
    formatDateSA(invoice.inv_date),
    invoice.invoice_no,
    'INVOICE SUMMARY',
    invoice.branch_name || 'Unknown Branch',
    invoice.customer_name || 'Unknown Customer',
    formatNumber(invoice.line_items_count || 0),
    formatCurrencyTable(invoice.total_cost || 0).replace(/[,\s]/g, ''),
    formatCurrencyTable(invoice.total_profit || 0).replace(/[,\s]/g, ''),
    formatCurrencyTable(invoice.total_sale_price || 0).replace(/[,\s]/g, ''),
    `${invoiceProfitPercentage}%`
  ])

  // Add empty row
  csvData.push([])

  // Add items if available
  if (items && items.length > 0) {
    items.forEach(item => {
      csvData.push([
        formatDateSA(invoice.inv_date),
        invoice.invoice_no,
        item.item_name,
        invoice.branch_name || 'Unknown Branch',
        invoice.customer_name || 'Unknown Customer',
        formatNumber(item.quantity),
        formatCurrencyTable(item.cost).replace(/[,\s]/g, ''),
        formatCurrencyTable(item.profit).replace(/[,\s]/g, ''),
        formatCurrencyTable(item.sale_price).replace(/[,\s]/g, ''),
        `${item.profit_percentage.toFixed(2)}%`
      ])
    })

    // Add totals row
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalSalePrice = items.reduce((sum, item) => sum + item.sale_price, 0)
    const totalCost = items.reduce((sum, item) => sum + item.cost, 0)
    const totalProfit = items.reduce((sum, item) => sum + item.profit, 0)
    const totalProfitPercentage = totalSalePrice > 0 
      ? ((totalProfit / totalSalePrice) * 100).toFixed(2)
      : '0.00'

    csvData.push([
      formatDateSA(invoice.inv_date),
      invoice.invoice_no,
      `TOTAL (${items.length} items)`,
      invoice.branch_name || 'Unknown Branch',
      invoice.customer_name || 'Unknown Customer',
      formatNumber(totalQuantity),
      formatCurrencyTable(totalCost).replace(/[,\s]/g, ''),
      formatCurrencyTable(totalProfit).replace(/[,\s]/g, ''),
      formatCurrencyTable(totalSalePrice).replace(/[,\s]/g, ''),
      `${totalProfitPercentage}%`
    ])
  }

  const csvContent = arrayToCSV(csvData)
  const defaultFilename = `invoice_${invoice.invoice_no}_with_items_${new Date().toISOString().slice(0, 16).replace(/:/g, '-')}.csv`
  
  downloadCSV(csvContent, filename || defaultFilename)
}

/**
 * Export multiple invoices with their expanded items - Flat format
 */
export function exportInvoicesWithExpandedItems(
  invoices: OptimizedInvoice[],
  expandedInvoices: Set<string>,
  invoiceItemsMap: Map<string, InvoiceItem[]>,
  filename?: string
): void {
  if (!invoices || invoices.length === 0) {
    console.warn('No invoice data to export')
    return
  }

  // Create flat format headers matching the desired layout
  const headers = [
    'Inv Date',
    'Inv No', 
    'Item',
    'Branch',
    'Qty',
    'Cost',
    'Profit',
    'Sale Price',
    'Profit %'
  ]

  const csvData: string[][] = [headers]

  // Process each invoice and its items
  invoices.forEach(invoice => {
    const items = invoiceItemsMap.get(invoice.invoice_no)
    
    if (items && items.length > 0) {
      // Add each item as a separate row
      items.forEach(item => {
        csvData.push([
          formatDateSA(invoice.inv_date),
          invoice.invoice_no,
          item.item_name,
          invoice.branch_name || 'Unknown Branch',
          formatNumber(item.quantity),
          formatCurrencyTable(item.cost).replace(/[,\s]/g, ''), // Total cost for this item
          formatCurrencyTable(item.profit).replace(/[,\s]/g, ''), // Total profit for this item
          formatCurrencyTable(item.sale_price).replace(/[,\s]/g, ''), // Total sale price for this item
          `${item.profit_percentage.toFixed(2)}%`
        ])
      })
    } else {
      // If no items, show invoice-level data
      const profitPercentage = invoice.total_sale_price > 0 
        ? ((invoice.total_profit / invoice.total_sale_price) * 100).toFixed(2)
        : '0.00'

      csvData.push([
        formatDateSA(invoice.inv_date),
        invoice.invoice_no,
        'No Items Found',
        invoice.branch_name || 'Unknown Branch',
        '0',
        formatCurrencyTable(invoice.total_cost || 0).replace(/[,\s]/g, ''),
        formatCurrencyTable(invoice.total_profit || 0).replace(/[,\s]/g, ''),
        formatCurrencyTable(invoice.total_sale_price || 0).replace(/[,\s]/g, ''),
        `${profitPercentage}%`
      ])
    }
  })

  const csvContent = arrayToCSV(csvData)
  const defaultFilename = `invoices_with_items_${new Date().toISOString().slice(0, 16).replace(/:/g, '-')}.csv`
  
  downloadCSV(csvContent, filename || defaultFilename)
}

// =============================================================================
// DATABASE-BASED EXPORT FUNCTIONS
// =============================================================================

/**
 * Export all invoices directly from database with current filters
 */
export async function exportInvoicesDirectFromDB(
  startDate?: Date,
  endDate?: Date,
  branchFilter?: string,
  customerFilter?: string,
  invoiceFilter?: string,
  filename?: string
): Promise<void> {
  try {
    console.log('📤 Starting database export for invoices...')
    
    // Convert dates to string format for database
    const startDateStr = startDate ? startDate.toISOString().split('T')[0] : undefined
    const endDateStr = endDate ? endDate.toISOString().split('T')[0] : undefined
    
    // Fetch all invoices from database with filters
    const invoices = await exportInvoicesForCSV(
      startDateStr,
      endDateStr,
      branchFilter,
      customerFilter,
      invoiceFilter
    )
    
    if (!invoices || invoices.length === 0) {
      console.warn('No invoice data found for export')
      alert('No invoices found matching the current filters.')
      return
    }
    
    // Use existing CSV export logic
    exportInvoicesToCSV(invoices, filename)
    
    console.log('✅ Database export completed successfully')
  } catch (error) {
    console.error('❌ Database export failed:', error)
    alert('Export failed. Please try again.')
    throw error
  }
}

/**
 * Export invoices with items directly from database
 */
export async function exportInvoicesWithItemsDirectFromDB(
  startDate?: Date,
  endDate?: Date,
  branchFilter?: string,
  customerFilter?: string,
  invoiceFilter?: string,
  filename?: string
): Promise<void> {
  try {
    console.log('📤 Starting database export for invoices with items...')
    
    // Convert dates to string format for database
    const startDateStr = startDate ? startDate.toISOString().split('T')[0] : undefined
    const endDateStr = endDate ? endDate.toISOString().split('T')[0] : undefined
    
    // Fetch all invoices and their items from database
    const result = await exportInvoicesWithItemsForCSV(
      startDateStr,
      endDateStr,
      branchFilter,
      customerFilter,
      invoiceFilter
    )
    
    if (!result || result.invoices.length === 0) {
      console.warn('No invoice data found for export with items')
      alert('No invoices found matching the current filters.')
      return
    }
    
    // Create expanded invoices set (all invoices that have items)
    const expandedInvoices = new Set<string>()
    result.itemsMap.forEach((items, invoiceNo) => {
      if (items.length > 0) {
        expandedInvoices.add(invoiceNo)
      }
    })
    
    // Use existing expanded export logic
    exportInvoicesWithExpandedItems(result.invoices, expandedInvoices, result.itemsMap, filename)
    
    console.log('✅ Database export with items completed successfully')
  } catch (error) {
    console.error('❌ Database export with items failed:', error)
    alert('Export with items failed. Please try again.')
    throw error
  }
}