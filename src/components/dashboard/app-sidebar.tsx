"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Home, Users, TrendingUp, Building2, Receipt, Calculator, User, LogOut, Shield, Sparkles, ReceiptText, Wallet } from "lucide-react"
import { useLocale } from "@/i18n/locale-provider"
import { SimpleLanguageSwitcher } from "@/components/language-switcher"
import { cssAnimations, createStaggeredClasses } from "@/lib/css-animations"
import { useAuth, useIsAdmin, useHiddenPages } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// Navigation items will be created inside the component to use translations

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLocale()
  const { user, signOut } = useAuth()
  const isAdmin = useIsAdmin()
  const hiddenPages = useHiddenPages()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const allNavigationItems = [
    {
      title: t("nav.navigation"),
      items: [
        {
          title: t("nav.overview"),
          url: "/",
          icon: Home,
        },
        {
          title: t("nav.customers"),
          url: "/customers",
          icon: Users,
        },
        {
          title: t("nav.vendors"),
          url: "/vendors",
          icon: Building2,
        },
        {
          title: t("nav.expenses"),
          url: "/expenses",
          icon: Receipt,
        },
        {
          title: t("nav.cash"),
          url: "/cash",
          icon: Wallet,
        },
        {
          title: t("nav.financials"),
          url: "/financials",
          icon: Calculator,
        },
        {
          title: t("vatReturn.nav_title"),
          url: "/vat-return",
          icon: ReceiptText,
        },
        {
          title: t("nav.whats_new"),
          url: "/whats-new",
          icon: Sparkles,
        },
      ],
    },
  ]

  // Filter navigation items based on user permissions
  // Admin users bypass filtering and see all pages
  const navigationItems = allNavigationItems.map(section => ({
    ...section,
    items: isAdmin
      ? section.items
      : section.items.filter(item => !hiddenPages.includes(item.url))
  }))

  const { isArabic } = useLocale()

  return (
    <Sidebar side={isArabic ? "right" : "left"} collapsible="icon" {...props}>
      <SidebarHeader>
        <div className={`flex items-center gap-2 px-2 py-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <TrendingUp className="size-4" />
          </div>
          <div className={`flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden ${isArabic ? 'text-right' : ''}`}>
            <span className="font-semibold">{t("dashboard.title")}</span>
            <span className="text-xs text-muted-foreground">{t("dashboard.subtitle")}</span>
          </div>
        </div>
        <div className="px-2 py-2 group-data-[collapsible=icon]:hidden">
          <SimpleLanguageSwitcher />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navigationItems.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className={isArabic ? 'text-right' : ''}>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="sidebar-menu">
                {section.items.map((item, index) => {
                  const isActive = pathname === item.url
                  const staggerDelay = index * 100
                  
                  return (
                    <SidebarMenuItem 
                      key={item.title}
                      className={`motion-safe:${cssAnimations.fadeInLeft} motion-safe:delay-[${staggerDelay}ms]`}
                    >
                      <SidebarMenuButton asChild isActive={isActive}>
                        <a 
                          href={item.url} 
                          className={`nav-item ${isArabic ? 'text-right' : ''} relative block ${cssAnimations.hoverScale} transition-all duration-200`}
                        >
                          {isActive && (
                            <div className="absolute inset-0 bg-primary/10 rounded-md" />
                          )}
                          <div className={`flex items-center gap-2 w-full relative z-10 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div className="transition-transform duration-200 hover:rotate-3">
                              <item.icon />
                            </div>
                            <span>{item.title}</span>
                          </div>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <User className="h-4 w-4" />
                  <span className="truncate">{user?.email}</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.email}</p>
                    {isAdmin && (
                      <Badge variant="destructive" className="w-fit">
                        <Shield className="h-3 w-3 mr-1" />
                        {t('user.admin')}
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  {t('user.profile')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('user.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}