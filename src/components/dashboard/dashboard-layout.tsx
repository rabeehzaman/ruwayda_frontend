"use client"

import * as React from "react"
import { AppSidebar } from "./app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useLocale } from "@/i18n/locale-provider"
import { useAuth } from "@/hooks/use-auth"
import { PanelLeft, PanelRight } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isArabic, t } = useLocale()
  const { permissions } = useAuth()

  const displayName = isArabic ? permissions?.displayNameAr : permissions?.displayNameEn

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className={`flex h-auto min-h-16 shrink-0 items-center justify-between gap-2 border-b px-3 sm:px-4 py-2 sm:py-0 flex-wrap sm:flex-nowrap ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <SidebarTrigger className={`${isArabic ? '-mr-1' : '-ml-1'} min-h-[44px] min-w-[44px]`}>
              {isArabic ? <PanelRight /> : <PanelLeft />}
            </SidebarTrigger>
            <Separator orientation="vertical" className={`h-4 hidden sm:block ${isArabic ? 'ml-2' : 'mr-2'}`} />
            <h1 className="font-semibold text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">{t("dashboard.title")}</h1>
          </div>
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            {displayName && (
              <>
                <span className="text-xs sm:text-sm text-muted-foreground hidden md:inline">
                  {t("common.welcome")}, {displayName}
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground md:hidden truncate max-w-[100px]">
                  {displayName}
                </span>
                <Separator orientation="vertical" className="h-4 hidden sm:block" />
              </>
            )}
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 md:p-6 overflow-x-hidden w-full max-w-full">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}