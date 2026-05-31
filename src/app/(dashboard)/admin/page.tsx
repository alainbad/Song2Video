import { getDbUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Video, AlertCircle, TrendingUp } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-500/20 text-green-400',
  FAILED: 'bg-red-500/20 text-red-400',
  RENDERING: 'bg-blue-500/20 text-blue-400',
  CREATED: 'bg-gray-500/20 text-gray-400',
}

export default async function AdminPage() {
  const user = await getDbUser()
  if (!user) redirect('/sign-in')

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim())
  if (!adminEmails.includes(user.email)) redirect('/dashboard')

  const [totalUsers, totalProjects, completedVideos, failedJobs, totalRevenueCents, recentProjects] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.project.count({ where: { status: 'COMPLETED' } }),
    prisma.project.count({ where: { status: 'FAILED' } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { email: true } } },
    }),
  ])

  const totalRevenue = (totalRevenueCents._sum.amount ?? 0) / 100

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Users', value: totalUsers, icon: <Users className="h-5 w-5 text-blue-400" /> },
          { label: 'Total Projects', value: totalProjects, icon: <Video className="h-5 w-5 text-purple-400" /> },
          { label: 'Videos Completed', value: completedVideos, icon: <Video className="h-5 w-5 text-green-400" /> },
          { label: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: <TrendingUp className="h-5 w-5 text-yellow-400" /> },
        ].map((stat) => (
          <Card key={stat.label} className="bg-white/5 border-white/10 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/60">{stat.label}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {failedJobs > 0 && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <span className="text-red-300 text-sm">{failedJobs} failed job{failedJobs > 1 ? 's' : ''} require attention.</span>
        </div>
      )}

      <Card className="bg-white/5 border-white/10 text-white">
        <CardHeader><CardTitle>Recent Projects</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-left">
                  <th className="pb-3 pr-4">Title</th>
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-white/5">
                    <td className="py-3 pr-4 font-medium">{project.title}</td>
                    <td className="py-3 pr-4 text-white/50">{project.user.email}</td>
                    <td className="py-3 pr-4">
                      <Badge className={`text-xs ${STATUS_COLORS[project.status] ?? 'bg-gray-500/20 text-gray-400'}`}>
                        {project.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 text-white/40">{new Date(project.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
