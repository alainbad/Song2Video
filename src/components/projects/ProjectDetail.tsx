'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Download, ArrowLeft, Music, Video, RefreshCw } from 'lucide-react'

type ProjectWithRelations = {
  id: string
  title: string
  status: string
  errorMsg: string | null
  song: { duration: number | null; genre: string | null; mood: string | null; bpm: number | null; lyrics: string | null } | null
  storyboard: { jsonData: unknown } | null
  videoScenes: { id: string; sceneOrder: number; prompt: string; imageUrl: string | null; duration: number | null }[]
  finalVideo: { id: string; downloadUrl: string } | null
}

const PIPELINE_STEPS = [
  { status: 'UPLOADING', label: 'Uploading audio', progress: 10 },
  { status: 'TRANSCRIBING', label: 'Transcribing lyrics', progress: 25 },
  { status: 'ANALYZING', label: 'Analyzing audio', progress: 40 },
  { status: 'GENERATING_STORYBOARD', label: 'Creating storyboard', progress: 55 },
  { status: 'GENERATING_SCENES', label: 'Generating scenes', progress: 70 },
  { status: 'RENDERING', label: 'Rendering video', progress: 88 },
  { status: 'COMPLETED', label: 'Complete', progress: 100 },
]

const STATUS_COLORS: Record<string, string> = {
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

function RetryButton({ projectId, onRetry }: { projectId: string; onRetry: () => void }) {
  const [loading, setLoading] = useState(false)
  const handleRetry = async () => {
    setLoading(true)
    try {
      await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      onRetry()
    } finally {
      setLoading(false)
    }
  }
  return (
    <Button onClick={handleRetry} disabled={loading} size="sm" variant="outline" className="border-red-500/50 text-red-300 hover:bg-red-500/10 shrink-0">
      {loading ? 'Retrying...' : 'Retry'}
    </Button>
  )
}

export function ProjectDetail({ project: initial }: { project: ProjectWithRelations }) {
  const [project, setProject] = useState(initial)
  const [polling, setPolling] = useState(!['COMPLETED', 'FAILED'].includes(initial.status))

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}`)
      if (res.ok) {
        const data = await res.json()
        setProject(data)
        if (['COMPLETED', 'FAILED'].includes(data.status)) {
          setPolling(false)
        }
      }
    } catch {
      // ignore
    }
  }, [project.id])

  useEffect(() => {
    if (!polling) return
    const interval = setInterval(fetchProject, 4000)
    return () => clearInterval(interval)
  }, [polling, fetchProject])

  const currentStepIndex = PIPELINE_STEPS.findIndex((s) => s.status === project.status)
  const progressValue = PIPELINE_STEPS[currentStepIndex]?.progress ?? 0

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
        <Badge className={STATUS_COLORS[project.status] ?? 'bg-gray-500/20 text-gray-400'}>
          {project.status.replace(/_/g, ' ')}
        </Badge>
        {polling && (
          <div className="flex items-center gap-1 text-xs text-white/40">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Updating...</span>
          </div>
        )}
        {project.status === 'COMPLETED' && (
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white ml-auto" onClick={fetchProject}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>

      {/* Pipeline Progress */}
      {!['COMPLETED', 'FAILED'].includes(project.status) && (
        <Card className="bg-white/5 border-white/10 text-white mb-6">
          <CardHeader>
            <CardTitle className="text-base">Processing your video</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progressValue} className="h-2" />
            <div className="space-y-2">
              {PIPELINE_STEPS.filter(s => s.status !== 'COMPLETED').map((step, i) => {
                const isDone = currentStepIndex > i
                const isCurrent = currentStepIndex === i
                return (
                  <div key={step.status} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 transition-all ${isDone ? 'bg-green-400' : isCurrent ? 'bg-blue-400 animate-pulse scale-125' : 'bg-white/20'}`} />
                    <span className={`text-sm transition-colors ${isDone ? 'text-green-400' : isCurrent ? 'text-white font-medium' : 'text-white/30'}`}>
                      {step.label}
                    </span>
                    {isCurrent && <span className="text-xs text-white/40 animate-pulse">in progress...</span>}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {project.status === 'FAILED' && (
        <Card className="bg-red-500/10 border-red-500/30 text-white mb-6">
          <CardContent className="pt-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-red-300 font-medium mb-1">Generation failed</p>
              <p className="text-red-400/80 text-sm">{project.errorMsg ?? 'An unknown error occurred.'}</p>
            </div>
            <RetryButton projectId={project.id} onRetry={() => { fetchProject(); setPolling(true) }} />
          </CardContent>
        </Card>
      )}

      {/* Final Video */}
      {project.status === 'COMPLETED' && project.finalVideo && (
        <Card className="bg-white/5 border-white/10 text-white mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Music Video is Ready!</CardTitle>
            <a href={`/api/video/download/${project.finalVideo.id}`}>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Download className="h-4 w-4 mr-2" />
                Download MP4
              </Button>
            </a>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center border border-white/10">
              <div className="text-center text-white/40">
                <Video className="h-16 w-16 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Click Download to save your 1080p MP4</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Storyboard */}
      {project.videoScenes.length > 0 && (
        <Card className="bg-white/5 border-white/10 text-white mb-6">
          <CardHeader>
            <CardTitle>Storyboard — {project.videoScenes.length} Scenes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {project.videoScenes.map((scene) => (
                <div key={scene.id} className="border border-white/10 rounded-lg overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-purple-900/30 to-black flex items-center justify-center relative">
                    {scene.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={scene.imageUrl} alt={`Scene ${scene.sceneOrder}`} className="w-full h-full object-cover" />
                    ) : (
                      <Music className="h-6 w-6 text-white/20" />
                    )}
                    <div className="absolute top-2 left-2 bg-black/60 text-xs text-purple-300 px-1.5 py-0.5 rounded">
                      {scene.sceneOrder}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-white/60 line-clamp-2">{scene.prompt}</p>
                    {scene.duration && <p className="text-xs text-white/30 mt-1">{scene.duration}s</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Song Analysis */}
      {project.song && (
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader><CardTitle>Song Analysis</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                { label: 'Duration', value: project.song.duration ? `${Math.round(project.song.duration)}s` : '—' },
                { label: 'Genre', value: project.song.genre ?? '—' },
                { label: 'Mood', value: project.song.mood ?? '—' },
                { label: 'BPM', value: project.song.bpm ? Math.round(project.song.bpm).toString() : '—' },
              ].map((item) => (
                <div key={item.label} className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/40 mb-1">{item.label}</div>
                  <div className="font-semibold capitalize">{item.value}</div>
                </div>
              ))}
            </div>
            {project.song.lyrics && (
              <details className="mt-2">
                <summary className="text-sm text-white/50 cursor-pointer hover:text-white/80">View lyrics</summary>
                <pre className="mt-2 text-xs text-white/50 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">{project.song.lyrics}</pre>
              </details>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
