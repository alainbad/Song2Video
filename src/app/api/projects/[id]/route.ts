import { NextResponse } from 'next/server'
import { requireDbUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireDbUser()
    const { id } = await params
    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
      include: { song: true, storyboard: true, videoScenes: { orderBy: { sceneOrder: 'asc' } }, finalVideo: true },
    })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(project)
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireDbUser()
    const { id } = await params
    const project = await prisma.project.findFirst({ where: { id, userId: user.id } })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.project.delete({ where: { id } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
