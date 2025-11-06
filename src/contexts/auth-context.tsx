"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UserPermissions {
  allowedBranches: string[]
  allowedCustomerOwners: string[]
  vehicleInstalmentDepartments: string[]
  loanFilterRules: {
    show_overdue: boolean
    remaining_days_threshold: number
  } | null
  hiddenPages: string[]
  role: string
  isAdmin: boolean
  preferredLanguage: string
  displayNameEn?: string
  displayNameAr?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  permissions: UserPermissions | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshPermissions: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPermissions = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_branch_permissions')
      .select('allowed_branches, allowed_customer_owners, vehicle_instalment_departments, loan_filter_rules, hidden_pages, role, preferred_language, display_name_en, display_name_ar')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      console.error('Error fetching permissions:', error)
      return null
    }

    return {
      allowedBranches: data.allowed_branches || [],
      allowedCustomerOwners: data.allowed_customer_owners || [],
      vehicleInstalmentDepartments: data.vehicle_instalment_departments || [],
      loanFilterRules: data.loan_filter_rules || null,
      hiddenPages: data.hidden_pages || [],
      role: data.role || 'viewer',
      isAdmin: data.allowed_branches?.includes('*') || false,
      preferredLanguage: data.preferred_language || 'en',
      displayNameEn: data.display_name_en,
      displayNameAr: data.display_name_ar
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        fetchPermissions(session.user.id).then(setPermissions)
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const perms = await fetchPermissions(session.user.id)
        setPermissions(perms)
      } else {
        setPermissions(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshPermissions = async () => {
    if (user) {
      const perms = await fetchPermissions(user.id)
      setPermissions(perms)
    }
  }

  const value = {
    user,
    session,
    permissions,
    loading,
    signIn,
    signOut,
    refreshPermissions
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
