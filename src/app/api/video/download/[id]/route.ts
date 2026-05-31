import { NextResponse } from 'next/server'
import { requireDbUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPresignedDownloadUrl } from '@/lib/s3'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireDbUser()
    const { id } = await params
    const finalVideo = await prisma.finalVideo.findFirst({ where: { id, project: { userId: user.id } } })
    if (!finalVideo) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const key = new URL(finalVideo.downloadUrl).pathname.slice(1)
    const signedUrl = await getPresignedDownloadUrl(key)
    return NextResponse.redirect(signedUrl)
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
