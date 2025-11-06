"use client"

import { useAuth } from '@/contexts/auth-context'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { user, permissions, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Profile</h1>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your user details and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-lg">{user?.email}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <div className="mt-1">
                <Badge variant={permissions?.isAdmin ? 'destructive' : 'default'}>
                  {permissions?.role || 'viewer'}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Assigned Branches</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {permissions?.isAdmin ? (
                  <Badge variant="destructive">All Branches (Admin)</Badge>
                ) : (
                  permissions?.allowedBranches.map(branch => (
                    <Badge key={branch} variant="secondary">{branch}</Badge>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={handleSignOut} variant="destructive">
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
