import { getDbUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CREDIT_PACKAGES } from '@/lib/credits'
import { Coins } from 'lucide-react'
import { PurchaseButton } from '@/components/billing/PurchaseButton'

export default async function BillingPage() {
  const user = await getDbUser()
  if (!user) redirect('/sign-in')

  const payments = await prisma.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-8">Billing</h1>

      <Card className="bg-white/5 border-white/10 text-white mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-400" />
            Credit Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-yellow-400">
            {user.subscriptionPlan === 'STUDIO' ? '∞' : user.credits}
          </div>
          <p className="text-white/50 mt-1">credits remaining · 1 credit = 1 minute of video</p>
          <Badge className="mt-2 bg-purple-600/20 text-purple-400 border-purple-600/30">{user.subscriptionPlan} plan</Badge>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mb-4">Purchase Credits</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {CREDIT_PACKAGES.map((pkg) => (
          <Card key={pkg.id} className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="text-lg">{pkg.name}</CardTitle>
              <div className="text-2xl font-bold">${(pkg.price / 100).toFixed(2)}</div>
              <div className="text-sm text-white/60">{pkg.description}</div>
            </CardHeader>
            <CardContent>
              <PurchaseButton packageId={pkg.id} />
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-4">Payment History</h2>
      <Card className="bg-white/5 border-white/10 text-white">
        <CardContent className="pt-4">
          {payments.length === 0 ? (
            <p className="text-white/40 text-center py-8">No payments yet.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                  <div>
                    <div className="font-medium">+{payment.creditsAdded} credits</div>
                    <div className="text-sm text-white/40">{new Date(payment.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${(payment.amount / 100).toFixed(2)}</div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Paid</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
