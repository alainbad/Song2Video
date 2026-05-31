import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Music } from 'lucide-react'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$9.99',
    credits: 10,
    description: 'Perfect for trying out the platform',
    features: ['10 credits (10 video minutes)', '1080p exports', 'Basic styles', 'Download MP4'],
    popular: false,
  },
  {
    id: 'creator',
    name: 'Creator',
    price: '$29',
    credits: 50,
    description: 'For active content creators',
    features: ['50 credits (50 video minutes)', '1080p exports', 'All styles', 'Priority queue', 'Download MP4'],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$79',
    credits: 150,
    description: 'For professional musicians',
    features: ['150 credits (150 video minutes)', '1080p exports', 'All styles', 'Priority queue', 'Commercial license', 'Download MP4'],
    popular: true,
  },
  {
    id: 'studio',
    name: 'Studio',
    price: '$199/mo',
    credits: -1,
    description: 'For labels and power users',
    features: ['Unlimited generation (fair use)', '1080p exports', 'All styles', 'Top priority queue', 'Commercial license', 'Dedicated support'],
    popular: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Music className="h-6 w-6 text-purple-400" />
          <span className="text-xl font-bold">Song2Video AI</span>
        </Link>
        <Link href="/sign-in">
          <Button variant="ghost" size="sm">Sign In</Button>
        </Link>
      </nav>
      <div className="px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-white/60 text-lg">1 credit = 1 minute of video. Pay only for what you use.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={`border text-white relative ${plan.popular ? 'bg-purple-600/20 border-purple-500' : 'bg-white/5 border-white/10'}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-purple-600">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="text-3xl font-bold">{plan.price}</div>
                <p className="text-sm text-white/60">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-purple-400 shrink-0" />
                      <span className="text-white/80">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up">
                  <Button className={`w-full ${plan.popular ? 'bg-purple-600 hover:bg-purple-700' : 'bg-white/10 hover:bg-white/20'}`}>
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
