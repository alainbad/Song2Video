import { NextResponse } from 'next/server'
import { requireDbUser } from '@/lib/auth'
import { pipelineQueue } from '@/lib/queue'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    await requireDbUser()
    const { jobId } = await params
    const job = await pipelineQueue.getJob(jobId)
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    const state = await job.getState()
    const project = await prisma.project.findUnique({
      where: { id: job.data.projectId },
      select: { status: true, errorMsg: true },
    })

    return NextResponse.json({ jobId, state, progress: job.progress, projectId: job.data.projectId, projectStatus: project?.status, errorMsg: project?.errorMsg })
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
