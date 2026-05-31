'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Upload, Music, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type UploadState = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

export default function NewProjectPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title.trim()) return

    setState('uploading')
    setProgress(10)
    setErrorMsg('')

    try {
      // Get audio duration
      const duration = await getAudioDuration(file)

      // Create project and get presigned URL
      const createRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          filename: file.name,
          contentType: file.type || 'audio/mpeg',
          duration,
        }),
      })

      if (!createRes.ok) {
        const err = await createRes.json()
        throw new Error(err.error ?? 'Failed to create project')
      }

      const { projectId, uploadUrl } = await createRes.json()
      setProgress(30)

      // Upload to S3
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(30 + Math.round((e.loaded / e.total) * 40))
          }
        })
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(`S3 upload failed: ${xhr.status}`))
        })
        xhr.addEventListener('error', () => reject(new Error('Upload failed')))
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type || 'audio/mpeg')
        xhr.send(file)
      })

      setProgress(75)

      // Confirm upload and start pipeline
      const s3Key = `songs/${projectId}/${file.name}`
      const confirmRes = await fetch('/api/songs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, s3Key, duration }),
      })

      if (!confirmRes.ok) {
        const err = await confirmRes.json()
        throw new Error(err.error ?? 'Failed to start processing')
      }

      setProgress(100)
      setState('processing')

      router.push(`/projects/${projectId}`)
    } catch (err) {
      setState('error')
      setErrorMsg((err as Error).message)
    }
  }

  return (
    <div className="p-8 text-white max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">New Project</h1>
      </div>

      <Card className="bg-white/5 border-white/10 text-white">
        <CardHeader><CardTitle>Upload Your Song</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Project Name</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Awesome Track"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audio">Audio File</Label>
              <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${file ? 'border-purple-500 bg-purple-500/10' : 'border-white/20 hover:border-white/40'}`}>
                <input
                  id="audio"
                  type="file"
                  accept=".mp3,.wav,.flac,audio/mpeg,audio/wav,audio/flac"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="audio" className="cursor-pointer">
                  {file ? (
                    <div>
                      <Music className="h-10 w-10 mx-auto mb-2 text-purple-400" />
                      <p className="font-medium text-purple-300">{file.name}</p>
                      <p className="text-sm text-white/40 mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-10 w-10 mx-auto mb-2 text-white/40" />
                      <p className="text-white/60">Drop your audio file here or click to browse</p>
                      <p className="text-sm text-white/30 mt-1">MP3, WAV, FLAC · Max 10 minutes</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {state === 'uploading' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-white/60">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {state === 'error' && (
              <p className="text-red-400 text-sm">{errorMsg}</p>
            )}

            <Button
              type="submit"
              disabled={!file || !title.trim() || state === 'uploading'}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              {state === 'uploading' ? 'Uploading...' : 'Generate Music Video'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio()
    const url = URL.createObjectURL(file)
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url)
      resolve(Math.min(audio.duration, 600))
    })
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      resolve(180) // fallback 3 minutes
    })
    audio.src = url
  })
}
