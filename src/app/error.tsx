'use client'
import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl font-bold text-white/10 mb-4">500</div>
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-white/50 mb-6">An unexpected error occurred. Our team has been notified.</p>
        <Button onClick={reset} className="bg-purple-600 hover:bg-purple-700">Try Again</Button>
      </div>
    </div>
  )
}
