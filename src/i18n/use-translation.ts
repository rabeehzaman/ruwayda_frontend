'use client'

import { useEffect, useState } from 'react'
import enTranslations from './translations/en.json'
import arTranslations from './translations/ar.json'

type TranslationKey = keyof typeof enTranslations
type NestedTranslationKey<T> = T extends object 
  ? { [K in keyof T]: `${K & string}` | `${K & string}.${NestedTranslationKey<T[K]> & string}` }[keyof T]
  : never

type AllTranslationKeys = NestedTranslationKey<typeof enTranslations>

const translations = {
  en: enTranslations,
  ar: arTranslations,
}

// Helper function to get nested value from object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path
}

// Helper function to detect locale from hostname
function detectLocale(): 'en' | 'ar' {
  if (typeof window === 'undefined') return 'en'
  
  const hostname = window.location.hostname
  console.log('Current hostname:', hostname) // Debug log
  return hostname.startsWith('ar.') ? 'ar' : 'en'
}

export function useTranslation() {
  const [locale, setLocale] = useState<'en' | 'ar'>('en')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setLocale(detectLocale())
  }, [])

  const t = (key: AllTranslationKeys | string): string => {
    if (!isClient) return key // Return key during SSR

    const translation = getNestedValue(translations[locale], key)
    return translation || key
  }

  const switchLanguage = () => {
    const currentHostname = window.location.hostname
    const currentPath = window.location.pathname
    const currentSearch = window.location.search
    
    if (locale === 'en') {
      // Switch to Arabic
      const newHostname = currentHostname.startsWith('www.') 
        ? currentHostname.replace('www.', 'ar.')
        : `ar.${currentHostname}`
      window.location.href = `${window.location.protocol}//${newHostname}${currentPath}${currentSearch}`
    } else {
      // Switch to English
      const newHostname = currentHostname.replace('ar.', 'www.').replace('ar.', '')
      window.location.href = `${window.location.protocol}//${newHostname}${currentPath}${currentSearch}`
    }
  }

  return {
    t,
    locale,
    isArabic: locale === 'ar',
    switchLanguage,
    isClient,
  }
}

// Hook specifically for server components
export function useServerTranslation(serverLocale: 'en' | 'ar' = 'en') {
  const t = (key: AllTranslationKeys | string): string => {
    return getNestedValue(translations[serverLocale], key) || key
  }

  return {
    t,
    locale: serverLocale,
    isArabic: serverLocale === 'ar',
  }
}