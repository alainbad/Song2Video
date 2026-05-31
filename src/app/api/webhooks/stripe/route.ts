import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET ?? '')
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { userId, creditsToAdd, packageId } = session.metadata ?? {}
    if (!userId || !creditsToAdd) return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })

    const credits = parseInt(creditsToAdd)
    const isUnlimited = packageId === 'studio'

    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: { userId, amount: session.amount_total ?? 0, creditsAdded: isUnlimited ? 0 : credits, stripePaymentId: session.payment_intent as string },
      })
      if (isUnlimited) {
        await tx.user.update({ where: { id: userId }, data: { subscriptionPlan: 'STUDIO' } })
      } else {
        await tx.user.update({ where: { id: userId }, data: { credits: { increment: credits } } })
      }
    })
  }

  return NextResponse.json({ received: true })
}
