"use client"

import * as React from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

interface CustomerOwnerFilterContextType {
  selectedOwners: string[]
  setSelectedOwners: (owners: string[]) => void
  availableOwners: string[]
  loadingOwners: boolean
  errorOwners: string | null
}

const CustomerOwnerFilterContext = React.createContext<CustomerOwnerFilterContextType | undefined>(undefined)

const STORAGE_KEY = "selected_customer_owners"

export function CustomerOwnerFilterProvider({ children }: { children: React.ReactNode }) {
  const { permissions } = useAuth()

  const [selectedOwners, setSelectedOwnersState] = React.useState<string[]>(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("Error parsing stored customer owners:", e)
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    }
    return []
  })

  const [availableOwners, setAvailableOwners] = React.useState<string[]>([])
  const [loadingOwners, setLoadingOwners] = React.useState(true)
  const [errorOwners, setErrorOwners] = React.useState<string | null>(null)

  // Fetch available customer owners once on mount
  React.useEffect(() => {
    async function fetchOwners() {
      try {
        setLoadingOwners(true)
        setErrorOwners(null)

        // If user has restricted permissions, use their allowed list
        if (permissions?.allowedCustomerOwners && permissions.allowedCustomerOwners.length > 0 && !permissions.isAdmin) {
          console.log('🔍 CustomerOwnerFilter Debug:', {
            hasPermissions: true,
            allowedOwners: permissions.allowedCustomerOwners,
            isAdmin: permissions.isAdmin
          })
          setAvailableOwners(permissions.allowedCustomerOwners)
          setLoadingOwners(false)
          return
        }

        // For admin users, fetch all owners from database
        const { data, error } = await supabase
          .from('customer_balance_aging_filtered')
          .select('customer_owner_name_custom')
          .not('customer_owner_name_custom', 'is', null)

        if (error) throw error

        const uniqueOwners = Array.from(new Set(
          data?.map(item => item.customer_owner_name_custom).filter(Boolean) || []
        ))

        console.log('🔍 CustomerOwnerFilter Debug:', {
          totalOwners: uniqueOwners.length,
          hasPermissions: !!permissions,
          isAdmin: permissions?.isAdmin
        })

        setAvailableOwners(uniqueOwners)
      } catch (err) {
        console.error('Error fetching customer owners:', err)
        setErrorOwners(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoadingOwners(false)
      }
    }

    fetchOwners()
  }, [permissions])

  // Update localStorage when selectedOwners changes
  const setSelectedOwners = React.useCallback((owners: string[]) => {
    setSelectedOwnersState(owners)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(owners))
    }
  }, [])

  const value = React.useMemo(
    () => ({
      selectedOwners,
      setSelectedOwners,
      availableOwners,
      loadingOwners,
      errorOwners
    }),
    [selectedOwners, setSelectedOwners, availableOwners, loadingOwners, errorOwners]
  )

  return (
    <CustomerOwnerFilterContext.Provider value={value}>
      {children}
    </CustomerOwnerFilterContext.Provider>
  )
}

export function useCustomerOwnerFilter() {
  const context = React.useContext(CustomerOwnerFilterContext)
  if (context === undefined) {
    throw new Error("useCustomerOwnerFilter must be used within a CustomerOwnerFilterProvider")
  }
  return context
}
