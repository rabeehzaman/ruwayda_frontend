/**
 * Saudi Riyal Currency Component
 * Renders currency values with the proper Saudi Riyal symbol font
 * The symbol uses the saudi_riyal font while numbers use the default DM Sans
 */

import { formatCurrency, getCurrencySymbol } from '@/lib/formatting'

interface SaudiRiyalCurrencyProps {
  value: number
  className?: string
}

export function SaudiRiyalCurrency({ value, className = '' }: SaudiRiyalCurrencyProps) {
  const symbol = getCurrencySymbol()
  const formattedNumber = value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  if (!symbol) {
    return <span className={className}>{formattedNumber}</span>
  }

  return (
    <span className={className}>
      <span className="saudi-riyal-symbol">{symbol}</span> {formattedNumber}
    </span>
  )
}

// Helper to use with existing formatCurrency calls
export function CurrencyText({ children, className = '' }: { children: string; className?: string }) {
  const symbol = getCurrencySymbol()

  if (!children.includes(symbol)) {
    return <span className={className}>{children}</span>
  }

  const parts = children.split(symbol)

  return (
    <span className={className}>
      <span className="saudi-riyal-symbol">{symbol}</span>
      {parts[1]}
    </span>
  )
}
