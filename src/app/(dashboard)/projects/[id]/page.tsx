import { getDbUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Download, ArrowLeft, Music, Video } from 'lucide-react'

const PIPELINE_STEPS = [
  { status: 'UPLOADING', label: 'Uploading' },
  { status: 'TRANSCRIBING', label: 'Transcribing Lyrics' },
  { status: 'ANALYZING', label: 'Analyzing Audio' },
  { status: 'GENERATING_STORYBOARD', label: 'Creating Storyboard' },
  { status: 'GENERATING_SCENES', label: 'Generating Scenes' },
  { status: 'RENDERING', label: 'Rendering Video' },
  { status: 'COMPLETED', label: 'Complete' },
]

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getDbUser()
  if (!user) redirect('/sign-in')

  const { id } = await params
  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
    include: {
      song: true,
      storyboard: true,
      videoScenes: { orderBy: { sceneOrder: 'asc' } },
      finalVideo: true,
    },
  })

  if (!project) notFound()

  const currentStepIndex = PIPELINE_STEPS.findIndex((s) => s.status === project.status)

  return (
    <div className="p-8 text-white">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{project.title}</h1>
        <Badge className={project.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : project.status === 'FAILED' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}>
          {project.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      {/* Pipeline progress */}
      {project.status !== 'COMPLETED' && project.status !== 'FAILED' && (
        <Card className="bg-white/5 border-white/10 text-white mb-6">
          <CardHeader><CardTitle>Processing Pipeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {PIPELINE_STEPS.map((step, i) => {
                const isDone = i < currentStepIndex
                const isCurrent = i === currentStepIndex
                return (
                  <div key={step.status} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${isDone ? 'bg-green-400' : isCurrent ? 'bg-blue-400 animate-pulse' : 'bg-white/20'}`} />
                    <span className={`text-sm ${isDone ? 'text-green-400' : isCurrent ? 'text-white' : 'text-white/40'}`}>{step.label}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {project.status === 'FAILED' && project.errorMsg && (
        <Card className="bg-red-500/10 border-red-500/30 text-white mb-6">
          <CardContent className="pt-4">
            <p className="text-red-400 text-sm">Error: {project.errorMsg}</p>
          </CardContent>
        </Card>
      )}

      {/* Final video */}
      {project.finalVideo && (
        <Card className="bg-white/5 border-white/10 text-white mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Music Video</CardTitle>
            <Link href={`/api/video/download/${project.finalVideo.id}`}>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Download className="h-4 w-4 mr-2" />
                Download MP4
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
              <Video className="h-16 w-16 text-white/20" />
              <p className="text-white/40 ml-4">Video ready — click Download to save</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Storyboard */}
      {project.videoScenes.length > 0 && (
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader><CardTitle>Storyboard ({project.videoScenes.length} scenes)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.videoScenes.map((scene) => (
                <div key={scene.id} className="border border-white/10 rounded-lg overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-purple-900/30 to-black flex items-center justify-center">
                    {scene.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={scene.imageUrl} alt={`Scene ${scene.sceneOrder}`} className="w-full h-full object-cover" />
                    ) : (
                      <Music className="h-8 w-8 text-white/20" />
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-xs text-purple-400 mb-1">Scene {scene.sceneOrder}</div>
                    <p className="text-sm text-white/70 line-clamp-2">{scene.prompt}</p>
                    {scene.duration && (
                      <p className="text-xs text-white/30 mt-1">{scene.duration}s</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Song info */}
      {project.song && (
        <Card className="bg-white/5 border-white/10 text-white mt-6">
          <CardHeader><CardTitle>Song Analysis</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Duration', value: project.song.duration ? `${Math.round(project.song.duration)}s` : '—' },
                { label: 'Genre', value: project.song.genre ?? '—' },
                { label: 'Mood', value: project.song.mood ?? '—' },
                { label: 'BPM', value: project.song.bpm ? Math.round(project.song.bpm).toString() : '—' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-xs text-white/40 mb-1">{item.label}</div>
                  <div className="font-semibold capitalize">{item.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
