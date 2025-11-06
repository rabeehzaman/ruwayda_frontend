// CSS-based animation utilities using Tailwind CSS classes
// This approach avoids compatibility issues with Framer Motion

export const cssAnimations = {
  // Basic entrance animations
  fadeIn: 'animate-in fade-in duration-300',
  fadeInUp: 'animate-in fade-in slide-in-from-bottom-4 duration-300',
  fadeInDown: 'animate-in fade-in slide-in-from-top-4 duration-300',
  fadeInLeft: 'animate-in fade-in slide-in-from-left-4 duration-300',
  fadeInRight: 'animate-in fade-in slide-in-from-right-4 duration-300',
  
  // Scale animations
  scaleIn: 'animate-in zoom-in-95 duration-300',
  scaleInCenter: 'animate-in zoom-in-95 fade-in duration-300',
  
  // Loading states
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
  
  // Hover effects (CSS classes)
  hoverScale: 'hover:scale-105 transition-transform duration-200',
  hoverLift: 'hover:-translate-y-1 hover:shadow-lg transition-all duration-200',
  hoverGlow: 'hover:shadow-md hover:shadow-primary/20 transition-all duration-200',
  
  // Active/pressed states
  activeScale: 'active:scale-95 transition-transform duration-100',
  
  // Stagger delays (for child elements)
  delay: {
    0: 'delay-0',
    75: 'delay-75',
    100: 'delay-100',
    150: 'delay-150',
    200: 'delay-200',
    300: 'delay-300',
    500: 'delay-500',
    700: 'delay-700',
    1000: 'delay-1000',
  },
  
  // Durations
  duration: {
    75: 'duration-75',
    100: 'duration-100',
    150: 'duration-150',
    200: 'duration-200',
    300: 'duration-300',
    500: 'duration-500',
    700: 'duration-700',
    1000: 'duration-1000',
  },
  
  // Easing
  ease: {
    linear: 'ease-linear',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out',
  },
} as const

// Utility to create staggered animations
export function createStaggeredClasses(
  baseAnimation: string,
  itemCount: number,
  delayIncrement: number = 100
): string[] {
  return Array.from({ length: itemCount }, (_, index) => {
    const delay = Math.min(index * delayIncrement, 1000) // Cap at 1s
    return `${baseAnimation} delay-[${delay}ms]`
  })
}

// Utility to check if user prefers reduced motion
export function getReducedMotionClasses(
  animatedClass: string,
  fallbackClass: string = ''
): string {
  return `motion-safe:${animatedClass} motion-reduce:${fallbackClass}`
}

// Common animation combinations
export const animationCombos = {
  cardEntrance: `${cssAnimations.fadeInUp} ${cssAnimations.hoverLift}`,
  buttonInteraction: `${cssAnimations.hoverScale} ${cssAnimations.activeScale}`,
  listItemEntry: cssAnimations.fadeInLeft,
  skeletonShimmer: cssAnimations.pulse,
  iconSpin: cssAnimations.spin,
  loadingBounce: cssAnimations.bounce,
} as const

// Responsive animation utilities
export const responsiveAnimations = {
  mobile: 'motion-reduce:animate-none sm:motion-safe:animate-in',
  desktop: 'hidden sm:motion-safe:animate-in sm:block',
} as const

// Page transition classes
export const pageTransitions = {
  enter: 'animate-in fade-in slide-in-from-bottom-2 duration-500',
  exit: 'animate-out fade-out slide-out-to-top-2 duration-300',
} as const