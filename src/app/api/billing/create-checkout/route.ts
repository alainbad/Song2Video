import { NextResponse } from 'next/server'
import { requireDbUser } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { CREDIT_PACKAGES } from '@/lib/credits'

export async function POST(req: Request) {
  try {
    const user = await requireDbUser()
    const body = await req.json().catch(() => ({}))
    const packageId = (body as { packageId?: string }).packageId

    const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId)
    if (!pkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 })

    let stripeCustomerId = user.stripeCustomerId
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name ?? undefined, metadata: { userId: user.id } })
      stripeCustomerId = customer.id
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId } })
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'usd', unit_amount: pkg.price, product_data: { name: `Song2Video ${pkg.name}`, description: pkg.description } }, quantity: 1 }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?cancelled=true`,
      metadata: { userId: user.id, creditsToAdd: pkg.credits.toString(), packageId: pkg.id },
    })

    return NextResponse.json({ checkoutUrl: session.url })
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
