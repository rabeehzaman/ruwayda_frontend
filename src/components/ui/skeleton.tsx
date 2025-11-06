import * as React from "react"
import { cn } from "@/lib/utils"
import { cssAnimations, getReducedMotionClasses } from "@/lib/css-animations"

interface SkeletonProps extends React.ComponentProps<"div"> {
  shimmerEffect?: boolean
}

function Skeleton({ className, shimmerEffect = true, ...props }: SkeletonProps) {
  const animationClass = shimmerEffect 
    ? getReducedMotionClasses(cssAnimations.pulse, '')
    : ''

  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent rounded-md", animationClass, className)}
      {...props}
    />
  )
}

// Enhanced skeleton with wave effect using CSS
function SkeletonWave({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton-wave"
      className={cn(
        "bg-accent rounded-md relative overflow-hidden",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        "before:animate-[shimmer_2s_linear_infinite]",
        "motion-reduce:before:animate-none",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton, SkeletonWave }