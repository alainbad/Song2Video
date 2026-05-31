import { NextResponse } from 'next/server'
import { requireDbUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPresignedUploadUrl, getS3Key } from '@/lib/s3'
import { z } from 'zod'

const CreateProjectSchema = z.object({
  title: z.string().min(1).max(100),
  filename: z.string().min(1),
  contentType: z.enum(['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp4', 'audio/x-flac', 'audio/x-wav']),
  duration: z.number().positive().max(600),
})

export async function POST(req: Request) {
  try {
    const user = await requireDbUser()
    const body = await req.json()
    const input = CreateProjectSchema.parse(body)

    const creditsNeeded = Math.ceil(input.duration / 60)
    if (user.subscriptionPlan !== 'STUDIO' && user.credits < creditsNeeded) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${creditsNeeded}, have ${user.credits}.` },
        { status: 402 }
      )
    }

    const project = await prisma.project.create({
      data: { userId: user.id, title: input.title, status: 'CREATED' },
    })

    const s3Key = getS3Key('songs', project.id, input.filename)
    const uploadUrl = await getPresignedUploadUrl(s3Key, input.contentType)

    await prisma.song.create({
      data: { projectId: project.id, fileUrl: '', duration: input.duration },
    })

    return NextResponse.json({ projectId: project.id, uploadUrl, s3Key })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 })
    if ((error as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await requireDbUser()
    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { song: true, finalVideo: true },
    })
    return NextResponse.json(projects)
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
