import { getDbUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AccountPage() {
  const user = await getDbUser()
  if (!user) redirect('/sign-in')

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-8">Account Settings</h1>
      <Card className="bg-white/5 border-white/10 text-white max-w-lg">
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-white/50 mb-1">Name</div>
            <div className="font-medium">{user.name ?? 'Not set'}</div>
          </div>
          <div>
            <div className="text-sm text-white/50 mb-1">Email</div>
            <div className="font-medium">{user.email}</div>
          </div>
          <div>
            <div className="text-sm text-white/50 mb-1">Plan</div>
            <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30">{user.subscriptionPlan}</Badge>
          </div>
          <div>
            <div className="text-sm text-white/50 mb-1">Member since</div>
            <div className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
