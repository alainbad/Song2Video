import type { Job } from 'bullmq'
import { prisma } from '@/lib/prisma'
import * as Sentry from '@sentry/nextjs'

export async function processPipeline(job: Job<{ projectId: string; userId: string; songDuration: number }>) {
  const { projectId } = job.data

  try {
    await job.updateProgress(10)
    await prisma.project.update({ where: { id: projectId }, data: { status: 'TRANSCRIBING' } })
    const { notifyGenerationStarted } = await import('@/services/notification.service')
    await notifyGenerationStarted(projectId).catch(console.error)
    const { transcribeAudio } = await import('@/services/whisper.service')
    const lyrics = await transcribeAudio(projectId)

    await job.updateProgress(25)
    await prisma.project.update({ where: { id: projectId }, data: { status: 'ANALYZING' } })
    const { extractAudioFeatures } = await import('@/services/audio-analysis.service')
    const features = await extractAudioFeatures(projectId, lyrics)

    await job.updateProgress(40)
    await prisma.project.update({ where: { id: projectId }, data: { status: 'GENERATING_STORYBOARD' } })
    const { generateStoryboard } = await import('@/services/storyboard.service')
    const storyboard = await generateStoryboard(projectId, lyrics, features)

    await job.updateProgress(60)
    await prisma.project.update({ where: { id: projectId }, data: { status: 'GENERATING_SCENES' } })
    const { generateSceneImages } = await import('@/services/image-gen.service')
    await generateSceneImages(projectId, storyboard)

    await job.updateProgress(75)
    await prisma.project.update({ where: { id: projectId }, data: { status: 'RENDERING' } })
    const { assembleVideo } = await import('@/services/ffmpeg.service')
    await assembleVideo(projectId)

    await job.updateProgress(100)
    await prisma.project.update({ where: { id: projectId }, data: { status: 'COMPLETED' } })

    const { notifyUser } = await import('@/services/notification.service')
    await notifyUser(projectId).catch(console.error)
  } catch (error) {
    Sentry.captureException(error)
    await prisma.project.update({ where: { id: projectId }, data: { status: 'FAILED', errorMsg: (error as Error).message } }).catch(console.error)
    throw error
  }
}
