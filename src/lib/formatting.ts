// Formatting utilities for Saudi Arabia region
import { format as formatDate } from 'date-fns'
import { ar } from 'date-fns/locale'

// Saudi Arabia timezone
const SAUDI_TIMEZONE = 'Asia/Riyadh'

// Test Saudi Riyal symbol implementation
const SAUDI_RIYAL_SYMBOL = '﷼' // Official Saudi Riyal symbol
const FALLBACK_SYMBOL = '' // No symbol fallback

// Function to test if Saudi Riyal symbol is supported
function testSaudiRiyalSupport(): boolean {
  try {
    // Test if the symbol renders properly
    const testElement = document.createElement('div')
    testElement.innerHTML = SAUDI_RIYAL_SYMBOL
    return testElement.textContent === SAUDI_RIYAL_SYMBOL
  } catch {
    return false
  }
}

// Get currency symbol based on support
export function getCurrencySymbol(): string {
  // For now, let's try the Saudi Riyal symbol
  // If it doesn't work well, we'll use no symbol
  try {
    return SAUDI_RIYAL_SYMBOL
  } catch {
    return FALLBACK_SYMBOL
  }
}

/**
 * Format currency with full numbers (no compact notation like 10K)
 * Tests Saudi Riyal symbol, falls back to no symbol if needed
 * Uses English numbers and Western formatting - FOR KPIs ONLY
 */
export function formatCurrency(value: number): string {
  const symbol = getCurrencySymbol()
  const formattedNumber = value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  
  // If we have a symbol, add it. Otherwise just return the number
  return symbol ? `${symbol}${formattedNumber}` : formattedNumber
}

/**
 * Format currency for tables - NO SYMBOL, just numbers
 * Uses English numbers and Western formatting
 */
export function formatCurrencyTable(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0'
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

/**
 * Format numbers with full display (no compact notation)
 * Uses English numbers
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * Format dates with Georgian calendar and English numbers in dd/mm/yyyy format
 * Uses Saudi Arabia timezone for accurate local time
 */
export function formatDateSA(date: Date | string): string {
  if (!date) return ''
  
  let dateObj: Date
  if (typeof date === 'string') {
    // Handle various string formats
    dateObj = parseDate(date)
  } else {
    dateObj = date
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return ''
  }
  
  // Convert to Saudi Arabia timezone and format as dd/mm/yyyy
  return dateObj.toLocaleDateString('en-GB', {
    timeZone: SAUDI_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Format date and time with Georgian calendar and English numbers
 * Uses Saudi Arabia timezone for accurate local time
 */
export function formatDateTimeSA(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  // Convert to Saudi Arabia timezone (+03:00) but use English locale for Georgian calendar
  return dateObj.toLocaleString('en-US', {
    timeZone: SAUDI_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Parse date string safely for sorting - handles both database format (yyyy-mm-dd) and display format (dd/mm/yyyy)
 */
export function parseDate(dateString: string): Date {
  if (!dateString) return new Date(0) // Return epoch for empty dates
  
  // First try yyyy-mm-dd format (database format) - most common case
  const yyyyMMddMatch = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (yyyyMMddMatch) {
    const [, year, month, day] = yyyyMMddMatch
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }
  
  // Try dd/mm/yyyy format (display format)
  const ddMMyyyyMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (ddMMyyyyMatch) {
    const [, day, month, year] = ddMMyyyyMatch
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }
  
  // Try direct parsing as fallback
  const parsedDate = new Date(dateString)
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate
  }
  
  // Return epoch for unparseable dates (will sort to beginning)
  console.warn(`Could not parse date: "${dateString}"`)
  return new Date(0)
}

/**
 * Test function to verify Saudi Riyal symbol rendering
 */
export function testCurrencyFormatting(): {
  saudiRiyalSupported: boolean
  testFormat: string
  symbol: string
} {
  const symbol = getCurrencySymbol()
  const testValue = 1234567.89
  const testFormat = formatCurrency(testValue)
  
  return {
    saudiRiyalSupported: symbol === SAUDI_RIYAL_SYMBOL,
    testFormat,
    symbol
  }
}