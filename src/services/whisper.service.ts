import { openai } from '@/lib/openai'
import { s3 } from '@/lib/s3'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const { toFile } = OpenAI

export async function transcribeAudio(projectId: string): Promise<string> {
  const song = await prisma.song.findUnique({ where: { projectId } })
  if (!song?.fileUrl) throw new Error('Song file URL not found')

  const s3Key = new URL(song.fileUrl).pathname.slice(1)
  const response = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: s3Key }))
  if (!response.Body) throw new Error('Failed to fetch audio from S3')

  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) chunks.push(chunk)
  const buffer = Buffer.concat(chunks)

  const audioFile = await toFile(buffer, 'audio.mp3', { type: 'audio/mpeg' })
  const transcription = await openai.audio.transcriptions.create({ file: audioFile, model: 'whisper-1', response_format: 'text' })
  const lyrics = typeof transcription === 'string' ? transcription : (transcription as { text: string }).text

  await prisma.song.update({ where: { projectId }, data: { lyrics } })
  return lyrics
}
