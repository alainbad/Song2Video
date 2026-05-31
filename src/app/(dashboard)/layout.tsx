import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { Music, LayoutDashboard, FolderOpen, CreditCard, Settings } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <aside className="w-64 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <Music className="h-6 w-6 text-purple-400" />
            <span className="font-bold text-lg">Song2Video</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" />, label: 'Dashboard' },
            { href: '/projects', icon: <FolderOpen className="h-4 w-4" />, label: 'Projects' },
            { href: '/billing', icon: <CreditCard className="h-4 w-4" />, label: 'Billing' },
            { href: '/account', icon: <Settings className="h-4 w-4" />, label: 'Account' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <UserButton />
            <span className="text-sm text-white/60">Account</span>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
