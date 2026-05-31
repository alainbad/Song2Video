import { getDbUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { ProjectDetail } from '@/components/projects/ProjectDetail'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getDbUser()
  if (!user) redirect('/sign-in')
  const { id } = await params
  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
    include: { song: true, storyboard: true, videoScenes: { orderBy: { sceneOrder: 'asc' } }, finalVideo: true },
  })
  if (!project) notFound()
  return <ProjectDetail project={project} />
}
