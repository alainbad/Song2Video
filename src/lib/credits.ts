import { prisma } from './prisma'

export const CREDIT_PACKAGES = [
  { id: 'starter', name: 'Starter', credits: 10, price: 999, description: '10 credits' },
  { id: 'creator', name: 'Creator', credits: 50, price: 2900, description: '50 credits' },
  { id: 'pro', name: 'Pro', credits: 150, price: 7900, description: '150 credits' },
  { id: 'studio', name: 'Studio', credits: -1, price: 19900, description: 'Unlimited (fair use)' },
] as const

export async function checkAndDeductCredits(userId: string, creditsNeeded: number) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')
    if (user.subscriptionPlan === 'STUDIO') return true
    if (user.credits < creditsNeeded) throw new Error('Insufficient credits')
    await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: creditsNeeded } },
    })
    return true
  })
}
