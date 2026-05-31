import { openai } from '@/lib/openai'
import { s3 } from '@/lib/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '@/lib/prisma'
import type { StoryboardData } from '@/types/project.types'

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}

export async function generateSceneImages(projectId: string, storyboard: StoryboardData): Promise<void> {
  for (const batch of chunk(storyboard.scenes, 3)) {
    await Promise.all(batch.map((scene) => generateSceneImage(projectId, scene.order, scene.visualDescription)))
  }
}

async function generateSceneImage(projectId: string, sceneOrder: number, prompt: string): Promise<void> {
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: `Cinematic music video scene: ${prompt}. Ultra detailed, professional photography, dramatic lighting.`,
    size: '1792x1024',
    quality: 'standard',
    n: 1,
  })

  const imageUrl = response.data?.[0]?.url
  if (!imageUrl) throw new Error(`No image URL for scene ${sceneOrder}`)

  const imageBuffer = Buffer.from(await (await fetch(imageUrl)).arrayBuffer())
  const s3Key = `scenes/${projectId}/${sceneOrder}.jpg`

  await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: s3Key, Body: imageBuffer, ContentType: 'image/jpeg' }))

  const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION ?? 'us-east-1'}.amazonaws.com/${s3Key}`
  await prisma.videoScene.update({ where: { projectId_sceneOrder: { projectId, sceneOrder } }, data: { imageUrl: s3Url } })
}
