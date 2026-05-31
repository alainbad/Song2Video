import { NextResponse } from 'next/server'
import { requireDbUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pipelineQueue } from '@/lib/queue'
import { z } from 'zod'

const GenerateSchema = z.object({
  projectId: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const user = await requireDbUser()
    const body = await req.json()
    const { projectId } = GenerateSchema.parse(body)

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
      include: { song: true },
    })
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    if (!project.song) return NextResponse.json({ error: 'No song uploaded' }, { status: 400 })

    const job = await pipelineQueue.add('process', {
      projectId,
      userId: user.id,
      songDuration: project.song.duration ?? 180,
    })

    await prisma.project.update({ where: { id: projectId }, data: { status: 'UPLOADING', errorMsg: null } })

    return NextResponse.json({ jobId: job.id })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 })
    if ((error as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
