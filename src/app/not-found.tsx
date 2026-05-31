import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl font-bold text-white/10 mb-4">404</div>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-white/50 mb-6">The page you are looking for does not exist.</p>
        <Link href="/">
          <Button className="bg-purple-600 hover:bg-purple-700">Go Home</Button>
        </Link>
      </div>
    </div>
  )
}
