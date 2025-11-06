"use client"

import { useAuth as useAuthContext } from '@/contexts/auth-context'

export const useAuth = useAuthContext

export function useUser() {
  const { user } = useAuthContext()
  return user
}

export function useIsAdmin() {
  const { permissions } = useAuthContext()
  return permissions?.isAdmin || false
}

export function useUserBranches() {
  const { permissions } = useAuthContext()
  return permissions?.allowedBranches || []
}

export function useUserRole() {
  const { permissions } = useAuthContext()
  return permissions?.role || 'viewer'
}

export function useHiddenPages() {
  const { permissions } = useAuthContext()
  return permissions?.hiddenPages || []
}
