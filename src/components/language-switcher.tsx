"use client"

import { Button } from "@/components/ui/button"
import { Globe, Languages } from "lucide-react"
import { useLocale } from "@/i18n/locale-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LanguageSwitcher() {
  const { locale, switchLanguage, isArabic, t } = useLocale()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t('language.switchLanguage')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isArabic ? "start" : "end"}>
        <DropdownMenuItem
          onClick={switchLanguage}
          className="cursor-pointer"
        >
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Languages className="h-4 w-4" />
            <span>{locale === 'en' ? t('language.arabic') : t('language.english')}</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Simple toggle version
export function SimpleLanguageSwitcher() {
  const { locale, switchLanguage, isArabic, t } = useLocale()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={switchLanguage}
      className="h-8 px-3"
    >
      <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
        <Globe className="h-4 w-4" />
        <span>{locale === 'en' ? t('language.ar') : t('language.en')}</span>
      </div>
    </Button>
  )
}