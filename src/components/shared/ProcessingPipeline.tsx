import { Progress } from '@/components/ui/progress'
import { CheckCircle, Circle, Loader2 } from 'lucide-react'

const STEPS = [
  { status: 'UPLOADING', label: 'Uploading audio' },
  { status: 'TRANSCRIBING', label: 'Transcribing lyrics' },
  { status: 'ANALYZING', label: 'Analyzing audio' },
  { status: 'GENERATING_STORYBOARD', label: 'Creating storyboard' },
  { status: 'GENERATING_SCENES', label: 'Generating scenes' },
  { status: 'RENDERING', label: 'Rendering video' },
  { status: 'COMPLETED', label: 'Complete' },
]

interface ProcessingPipelineProps {
  currentStatus: string
  className?: string
}

export function ProcessingPipeline({ currentStatus, className = '' }: ProcessingPipelineProps) {
  const currentIndex = STEPS.findIndex((s) => s.status === currentStatus)
  const progress = currentIndex === -1 ? 0 : Math.round((currentIndex / (STEPS.length - 1)) * 100)

  return (
    <div className={`space-y-3 ${className}`}>
      <Progress value={progress} className="h-1.5" />
      <div className="space-y-2">
        {STEPS.filter((s) => s.status !== 'COMPLETED').map((step, i) => {
          const isDone = currentIndex > i
          const isCurrent = currentIndex === i
          return (
            <div key={step.status} className="flex items-center gap-3">
              {isDone ? (
                <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="h-4 w-4 text-blue-400 animate-spin shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-white/20 shrink-0" />
              )}
              <span className={`text-sm ${isDone ? 'text-green-400' : isCurrent ? 'text-white font-medium' : 'text-white/30'}`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
