import { openai } from '@/lib/openai'
import { prisma } from '@/lib/prisma'
import type { AudioFeatures } from './audio-analysis.service'
import type { StoryboardData } from '@/types/project.types'

export async function generateStoryboard(projectId: string, lyrics: string, features: AudioFeatures): Promise<StoryboardData> {
  const song = await prisma.song.findUnique({ where: { projectId } })
  const totalDuration = song?.duration ?? 180

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a creative music video director. Generate a storyboard with exactly 10 scenes.
Return JSON: { "scenes": [ { "order": 1, "title": "...", "visualDescription": "...", "cameraMotion": "...", "colorPalette": "...", "duration": number } ] }
Scene durations must sum to ${Math.round(totalDuration)} seconds. Match mood: ${features.mood}, genre: ${features.genre}, energy: ${features.energy}.`,
      },
      { role: 'user', content: `Create a storyboard for:\n\nLyrics:\n${lyrics.slice(0, 3000)}\n\nMood: ${features.mood}\nGenre: ${features.genre}` },
    ],
  })

  const parsed = JSON.parse(response.choices[0]?.message?.content ?? '{}')
  const storyboardData: StoryboardData = { scenes: parsed.scenes ?? [], totalDuration }

  await prisma.storyboard.upsert({
    where: { projectId },
    create: { projectId, jsonData: storyboardData as object },
    update: { jsonData: storyboardData as object },
  })

  for (const scene of storyboardData.scenes) {
    await prisma.videoScene.upsert({
      where: { projectId_sceneOrder: { projectId, sceneOrder: scene.order } },
      create: { projectId, sceneOrder: scene.order, prompt: scene.visualDescription, duration: scene.duration },
      update: { prompt: scene.visualDescription, duration: scene.duration },
    })
  }

  return storyboardData
}
