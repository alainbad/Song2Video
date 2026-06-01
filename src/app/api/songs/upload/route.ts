import { NextResponse } from 'next/server'
import { requireDbUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAndDeductCredits } from '@/lib/credits'
import { pipelineQueue } from '@/lib/queue'
import { getS3Url } from '@/lib/s3'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/ratelimit'
import { headers } from 'next/headers'

const ConfirmUploadSchema = z.object({
  projectId: z.string().min(1),
  s3Key: z.string().min(1),
  duration: z.number().positive().max(600),
})

export async function POST(req: Request) {
  try {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') ?? headersList.get('x-real-ip') ?? 'anonymous'
    const { success } = await checkRateLimit(`upload:${ip}`)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please wait before uploading again.' }, { status: 429 })
    }
    const user = await requireDbUser()
    const body = await req.json()
    const input = ConfirmUploadSchema.parse(body)

    const project = await prisma.project.findFirst({ where: { id: input.projectId, userId: user.id } })
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const creditsNeeded = Math.ceil(input.duration / 60)
    await checkAndDeductCredits(user.id, creditsNeeded)

    const fileUrl = getS3Url(input.s3Key)
    await prisma.song.update({ where: { projectId: input.projectId }, data: { fileUrl, duration: input.duration } })
    await prisma.project.update({ where: { id: input.projectId }, data: { status: 'UPLOADING' } })

    const job = await pipelineQueue.add('process', { projectId: input.projectId, userId: user.id, songDuration: input.duration })

    return NextResponse.json({ jobId: job.id, status: 'queued' })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 })
    if ((error as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if ((error as Error).message === 'Insufficient credits') return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
