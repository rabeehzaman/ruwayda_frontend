"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { UpdateCard } from "@/components/whats-new/update-card"
import { useLocale } from "@/i18n/locale-provider"
import { updates } from "@/data/updates"
import { Sparkles } from "lucide-react"

export default function WhatsNewPage() {
  const { t, isArabic } = useLocale()

  // Sort updates by date (newest first)
  const sortedUpdates = [...updates].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <DashboardLayout>
      {/* Header */}
      <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full max-w-full overflow-x-hidden ${isArabic ? 'sm:flex-row-reverse' : ''}`}>
        <div className={isArabic ? 'text-right' : ''}>
          <div className={`flex items-center gap-2 mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t("pages.whats_new.title")}
            </h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("pages.whats_new.description")}
          </p>
        </div>
      </div>

      {/* Updates Timeline */}
      <div className="relative">
        <div className="space-y-6">
          {sortedUpdates.map((update, index) => (
            <UpdateCard key={update.id} update={update} index={index} />
          ))}
        </div>

        {sortedUpdates.length === 0 && (
          <div className={`text-center py-12 ${isArabic ? 'text-right' : ''}`}>
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {t("pages.whats_new.no_updates")}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
