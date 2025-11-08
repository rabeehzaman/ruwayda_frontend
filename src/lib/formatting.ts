// Formatting utilities for Saudi Arabia region
import { format as formatDate } from 'date-fns'
import { ar } from 'date-fns/locale'

// Saudi Arabia timezone
const SAUDI_TIMEZONE = 'Asia/Riyadh'

// Official Saudi Riyal symbol
// Using U+E900 (legacy private-use) for better font compatibility
// The @emran-alhaddad/saudi-riyal-font package supports both U+E900 and U+20C1
// U+E900 is more reliable for current font rendering
const SAUDI_RIYAL_SYMBOL = '\uE900' // Saudi Riyal symbol (private-use Unicode)
const FALLBACK_SYMBOL = '' // No symbol fallback

// Get currency symbol
export function getCurrencySymbol(): string {
  return SAUDI_RIYAL_SYMBOL
}

/**
 * Format currency with full numbers (no compact notation like 10K)
 * Uses official Saudi Riyal symbol (U+E900 private-use Unicode)
 * Uses English numbers and Western formatting - FOR KPIs ONLY
 * Symbol positioned left of numerals with space (per SAMA guidelines)
 * NOTE: Returns plain text - for React components, use a wrapper with saudi-riyal-symbol class
 */
export function formatCurrency(value: number): string {
  const symbol = getCurrencySymbol()
  const formattedNumber = value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  // Add space between symbol and number (per SAMA official guidelines)
  return symbol ? `${symbol} ${formattedNumber}` : formattedNumber
}

/**
 * Format currency and return HTML string with proper font styling
 * Use this for rendering in React components with dangerouslySetInnerHTML
 */
export function formatCurrencyHTML(value: number): string {
  const symbol = getCurrencySymbol()
  const formattedNumber = value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  if (!symbol) return formattedNumber

  // Wrap symbol in span with saudi-riyal-symbol class to apply the font
  return `<span class="saudi-riyal-symbol">${symbol}</span> ${formattedNumber}`
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
 * Checks if the Unicode U+E900 symbol is being used
 */
export function testCurrencyFormatting(): {
  saudiRiyalSupported: boolean
  testFormat: string
  symbol: string
  unicodePoint: string
} {
  const symbol = getCurrencySymbol()
  const testValue = 1234567.89
  const testFormat = formatCurrency(testValue)

  return {
    saudiRiyalSupported: symbol === SAUDI_RIYAL_SYMBOL,
    testFormat,
    symbol,
    unicodePoint: 'U+E900'
  }
}