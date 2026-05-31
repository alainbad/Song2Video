import { getDbUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Coins, Video, Clock, HardDrive, Plus } from 'lucide-react'

export default async function DashboardPage() {
  const user = await getDbUser()
  if (!user) redirect('/sign-in')

  const [completedProjects, processingProjects, totalProjects] = await Promise.all([
    prisma.project.count({ where: { userId: user.id, status: 'COMPLETED' } }),
    prisma.project.count({
      where: {
        userId: user.id,
        status: { in: ['UPLOADING', 'TRANSCRIBING', 'ANALYZING', 'GENERATING_STORYBOARD', 'GENERATING_SCENES', 'RENDERING'] },
      },
    }),
    prisma.project.count({ where: { userId: user.id } }),
  ])

  const recentProjects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { song: true },
  })

  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
    FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
    RENDERING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    CREATED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-white/60">Welcome back, {user.name ?? user.email}</p>
        </div>
        <Link href="/projects/new">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Credits Remaining', value: user.subscriptionPlan === 'STUDIO' ? '∞' : user.credits, icon: <Coins className="h-5 w-5 text-yellow-400" /> },
          { label: 'Videos Generated', value: completedProjects, icon: <Video className="h-5 w-5 text-purple-400" /> },
          { label: 'Processing Jobs', value: processingProjects, icon: <Clock className="h-5 w-5 text-blue-400" /> },
          { label: 'Total Projects', value: totalProjects, icon: <HardDrive className="h-5 w-5 text-green-400" /> },
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

      <Card className="bg-white/5 border-white/10 text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Projects</CardTitle>
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <Video className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No projects yet. Create your first music video!</p>
              <Link href="/projects/new">
                <Button className="mt-4 bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div>
                      <div className="font-medium">{project.title}</div>
                      <div className="text-sm text-white/40">{new Date(project.createdAt).toLocaleDateString()}</div>
                    </div>
                    <Badge className={statusColors[project.status] ?? 'bg-gray-500/20 text-gray-400'}>
                      {project.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
