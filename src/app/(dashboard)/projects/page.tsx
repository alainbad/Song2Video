import { getDbUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, Video, Music } from 'lucide-react'

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
  FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
  RENDERING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  GENERATING_SCENES: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  GENERATING_STORYBOARD: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  ANALYZING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  TRANSCRIBING: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  UPLOADING: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  CREATED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

export default async function ProjectsPage() {
  const user = await getDbUser()
  if (!user) redirect('/sign-in')

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { song: true, finalVideo: true },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <Link href="/projects/new">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card className="bg-white/5 border-white/10 text-white">
          <CardContent className="text-center py-16">
            <Video className="h-16 w-16 mx-auto mb-4 text-white/20" />
            <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
            <p className="text-white/50 mb-6">Upload a song to create your first AI music video</p>
            <Link href="/projects/new">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Create First Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors cursor-pointer h-full">
                <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-black flex items-center justify-center rounded-t-lg">
                  {project.finalVideo ? (
                    <Video className="h-12 w-12 text-purple-400" />
                  ) : (
                    <Music className="h-12 w-12 text-white/20" />
                  )}
                </div>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold truncate">{project.title}</h3>
                      <p className="text-sm text-white/40 mt-1">{new Date(project.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge className={`shrink-0 text-xs ${statusColors[project.status] ?? ''}`}>
                      {project.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  {project.song?.duration && (
                    <p className="text-xs text-white/30 mt-2">
                      {Math.round(project.song.duration)}s · {project.song.genre ?? 'Unknown genre'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
