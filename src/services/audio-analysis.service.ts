import { openai } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

export interface AudioFeatures {
  bpm?: number
  genre: string
  mood: string
  energy: string
}

export async function extractAudioFeatures(projectId: string, lyrics: string): Promise<AudioFeatures> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You are a music analyst. Analyze song lyrics and return JSON: { "genre": string, "mood": string, "energy": "low"|"medium"|"high", "estimatedBPM": number }' },
      { role: 'user', content: `Analyze these song lyrics:\n\n${lyrics.slice(0, 2000)}` },
    ],
  })

  const content = response.choices[0]?.message?.content ?? '{}'
  const analysis = JSON.parse(content)

  const features: AudioFeatures = {
    genre: analysis.genre ?? 'Unknown',
    mood: analysis.mood ?? 'Unknown',
    energy: analysis.energy ?? 'medium',
    bpm: analysis.estimatedBPM ?? undefined,
  }

  await prisma.song.update({
    where: { projectId },
    data: { genre: features.genre, mood: features.mood, energy: features.energy === 'high' ? 0.8 : features.energy === 'low' ? 0.2 : 0.5, bpm: features.bpm ?? null },
  })

  return features
}
