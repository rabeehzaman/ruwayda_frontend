"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useLocale } from "@/i18n/locale-provider"
import { Sparkles, Bug, TrendingUp, AlertTriangle } from "lucide-react"
import { type Update, type UpdateCategory } from "@/data/updates"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

interface UpdateCardProps {
  update: Update
  index?: number
}

const categoryConfig: Record<UpdateCategory, {
  icon: React.ComponentType<{ className?: string }>,
  colorClass: string,
  labelEn: string,
  labelAr: string
}> = {
  feature: {
    icon: Sparkles,
    colorClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    labelEn: 'New Feature',
    labelAr: 'ميزة جديدة'
  },
  bugfix: {
    icon: Bug,
    colorClass: 'bg-green-500/10 text-green-600 border-green-500/20',
    labelEn: 'Bug Fix',
    labelAr: 'إصلاح خطأ'
  },
  improvement: {
    icon: TrendingUp,
    colorClass: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    labelEn: 'Improvement',
    labelAr: 'تحسين'
  },
  breaking: {
    icon: AlertTriangle,
    colorClass: 'bg-destructive/10 text-destructive border-destructive/20',
    labelEn: 'Breaking Change',
    labelAr: 'تغيير جذري'
  }
}

export function UpdateCard({ update, index = 0 }: UpdateCardProps) {
  const { isArabic } = useLocale()
  const config = categoryConfig[update.category]
  const Icon = config.icon

  const formattedDate = format(
    new Date(update.date),
    'MMMM d, yyyy',
    { locale: isArabic ? ar : undefined }
  )

  const title = isArabic ? update.titleAr : update.titleEn
  const description = isArabic ? update.descriptionAr : update.descriptionEn
  const changes = isArabic ? update.changes?.ar : update.changes?.en

  return (
    <Card delay={index * 100} className="relative overflow-hidden">
      {/* Timeline connector */}
      {index > 0 && (
        <div
          className={`absolute top-0 w-0.5 h-6 bg-border -translate-y-6 ${isArabic ? 'right-6' : 'left-6'}`}
        />
      )}

      <CardHeader>
        <div className={`flex items-start gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
          {/* Timeline dot */}
          <div className="relative flex-shrink-0">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-primary ring-4 ring-background" />
          </div>

          <div className={`flex-1 ${isArabic ? 'text-right' : ''}`}>
            <div className={`flex flex-wrap items-center gap-2 mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Badge variant="outline" className={`text-xs ${config.colorClass} ${isArabic ? 'flex-row-reverse' : ''}`}>
                <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isArabic ? 'ml-1' : 'mr-1'}`} />
                {isArabic ? config.labelAr : config.labelEn}
              </Badge>

              {update.version && (
                <Badge variant="secondary" className="text-xs">
                  v{update.version}
                </Badge>
              )}

              <span className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                {/* Mobile: Short date format */}
                <span className="md:hidden">{format(new Date(update.date), 'MMM d, yyyy')}</span>
                {/* Desktop: Full date format */}
                <span className="hidden md:inline">{formattedDate}</span>
              </span>
            </div>

            <CardTitle className="mb-1 text-base sm:text-lg">{title}</CardTitle>
            <CardDescription className="text-sm sm:text-base">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      {changes && changes.length > 0 && (
        <>
          <Separator />
          <CardContent className="px-4 sm:px-6">
            <ul className={`space-y-2 sm:space-y-2.5 ${isArabic ? 'text-right' : ''}`}>
              {changes.map((change, idx) => (
                <li
                  key={idx}
                  className={`text-xs sm:text-sm text-muted-foreground flex items-start gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}
                >
                  <span className="flex-shrink-0 leading-relaxed">{change}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </>
      )}
    </Card>
  )
}
