"use client"

import { useEffect, useRef } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { respectsReducedMotion } from '@/lib/animations'

interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
  decimals?: number
  formatter?: (value: number) => string
}

export function AnimatedNumber({
  value,
  duration = 1,
  className,
  prefix = '',
  suffix = '',
  decimals = 0,
  formatter,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useSpring(0, { 
    duration: respectsReducedMotion() ? 0 : duration * 1000,
    bounce: 0 
  })
  const rounded = useTransform(motionValue, (latest) => {
    if (formatter) {
      return formatter(latest)
    }
    return latest.toFixed(decimals)
  })

  useEffect(() => {
    motionValue.set(value)
  }, [motionValue, value])

  if (respectsReducedMotion()) {
    const displayValue = formatter ? formatter(value) : value.toFixed(decimals)
    return (
      <span ref={ref} className={className}>
        {prefix}{displayValue}{suffix}
      </span>
    )
  }

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  )
}

// Specialized component for currency formatting
interface AnimatedCurrencyProps extends Omit<AnimatedNumberProps, 'formatter'> {
  currency?: string
  locale?: string
}

export function AnimatedCurrency({
  value,
  currency = 'USD',
  locale = 'en-US',
  ...props
}: AnimatedCurrencyProps) {
  const formatter = (val: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(val)
  }

  return <AnimatedNumber {...props} value={value} formatter={formatter} />
}

// Specialized component for percentage formatting
export function AnimatedPercentage({
  value,
  ...props
}: Omit<AnimatedNumberProps, 'formatter' | 'suffix'>) {
  const formatter = (val: number) => val.toFixed(1)

  return <AnimatedNumber {...props} value={value} formatter={formatter} suffix="%" />
}