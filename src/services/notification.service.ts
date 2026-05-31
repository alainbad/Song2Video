import { prisma } from '@/lib/prisma'

export async function notifyUser(projectId: string): Promise<void> {
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { user: true } })
  if (!project) return
  // TODO: integrate Resend/SendGrid in Sprint 6
  console.log(`[Notification] Project ${projectId} completed for ${project.user.email}`)
}
