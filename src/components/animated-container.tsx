"use client"

import { motion } from 'framer-motion'
import { staggerContainer, fastStaggerContainer, respectsReducedMotion } from '@/lib/animations'

interface AnimatedContainerProps {
  children: React.ReactNode
  className?: string
  stagger?: 'normal' | 'fast'
  delay?: number
}

export function AnimatedContainer({ 
  children, 
  className, 
  stagger = 'normal',
  delay = 0 
}: AnimatedContainerProps) {
  const shouldAnimate = !respectsReducedMotion()

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>
  }

  const variants = stagger === 'fast' ? fastStaggerContainer : staggerContainer

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        delayChildren: delay,
        staggerChildren: stagger === 'fast' ? 0.05 : 0.1,
      }}
    >
      {children}
    </motion.div>
  )
}