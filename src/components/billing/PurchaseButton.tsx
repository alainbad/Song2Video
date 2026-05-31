'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function PurchaseButton({ packageId }: { packageId: string }) {
  const [loading, setLoading] = useState(false)

  const handlePurchase = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      })
      const data = await res.json()
      if (data.checkoutUrl) window.location.href = data.checkoutUrl
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handlePurchase} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
      {loading ? 'Redirecting...' : 'Purchase'}
    </Button>
  )
}
