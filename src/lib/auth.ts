import { auth } from '@clerk/nextjs/server'
import { prisma } from './prisma'

export async function getDbUser() {
  const { userId } = await auth()
  if (!userId) return null
  return prisma.user.findUnique({ where: { clerkId: userId } })
}

export async function requireDbUser() {
  const user = await getDbUser()
  if (!user) throw new Error('Unauthorized')
  return user
}
