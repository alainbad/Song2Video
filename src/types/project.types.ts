export type ProjectStatus =
  | 'CREATED'
  | 'UPLOADING'
  | 'TRANSCRIBING'
  | 'ANALYZING'
  | 'GENERATING_STORYBOARD'
  | 'GENERATING_SCENES'
  | 'RENDERING'
  | 'COMPLETED'
  | 'FAILED'

export interface StoryboardScene {
  order: number
  title: string
  visualDescription: string
  cameraMotion: string
  colorPalette: string
  duration: number
  voiceover?: string
}

export interface StoryboardData {
  scenes: StoryboardScene[]
  totalDuration: number
}
