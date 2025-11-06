'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import enTranslations from './translations/en.json'
import arTranslations from './translations/ar.json'

type Locale = 'en' | 'ar'

interface LocaleContextType {
  locale: Locale
  isArabic: boolean
  t: (key: string) => string
  switchLanguage: () => void
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

const translations = {
  en: enTranslations,
  ar: arTranslations,
}

// Helper function to get nested value from object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path
}

interface LocaleProviderProps {
  children: ReactNode
  initialLocale: Locale
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const t = (key: string): string => {
    const translation = getNestedValue(translations[initialLocale], key)
    return translation || key
  }

  const switchLanguage = () => {
    const currentUrl = new URL(window.location.href)
    const newLocale = initialLocale === 'en' ? 'ar' : 'en'
    
    // Set the language query parameter
    currentUrl.searchParams.set('lang', newLocale)
    
    // Store preference in cookie
    document.cookie = `preferred-language=${newLocale}; path=/; max-age=${365 * 24 * 60 * 60}; secure; samesite=lax`
    
    // Navigate to the new URL
    window.location.href = currentUrl.toString()
  }

  return (
    <LocaleContext.Provider value={{
      locale: initialLocale,
      isArabic: initialLocale === 'ar',
      t,
      switchLanguage,
    }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}