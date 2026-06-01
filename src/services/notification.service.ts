import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function notifyUser(projectId: string): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { user: true, finalVideo: true },
  })
  if (!project) return

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'placeholder') {
    console.log(`[Notification] Project ${projectId} completed for ${project.user.email} (email skipped - no RESEND_API_KEY)`)
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  await resend.emails.send({
    from: 'Song2Video AI <noreply@song2video.ai>',
    to: project.user.email,
    subject: `Your music video is ready — ${project.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; background: #0a0a0a; color: #fff; padding: 40px; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #a855f7; font-size: 24px; margin: 0;">🎬 Your music video is ready!</h1>
        </div>
        <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 8px; font-size: 18px;">${project.title}</h2>
          <p style="color: #888; margin: 0;">Your AI-generated music video has been created and is ready to download.</p>
        </div>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${appUrl}/projects/${projectId}"
             style="background: #a855f7; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
            View &amp; Download Your Video
          </a>
        </div>
        <p style="color: #555; font-size: 12px; text-align: center;">
          Song2Video AI · <a href="${appUrl}" style="color: #777;">song2video.ai</a>
        </p>
      </body>
      </html>
    `,
  }).catch((err) => {
    console.error('[Notification] Failed to send email:', err)
  })
}

export async function notifyGenerationStarted(projectId: string): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { user: true },
  })
  if (!project) return

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'placeholder') {
    console.log(`[Notification] Generation started for ${project.user.email} (email skipped)`)
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  await resend.emails.send({
    from: 'Song2Video AI <noreply@song2video.ai>',
    to: project.user.email,
    subject: `Generating your video — ${project.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; background: #0a0a0a; color: #fff; padding: 40px; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #a855f7; font-size: 24px; margin: 0;">⚡ Generating your music video</h1>
        </div>
        <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 8px; font-size: 18px;">${project.title}</h2>
          <p style="color: #888; margin: 0;">We're working on your video. This usually takes 5-10 minutes. We'll email you when it's done.</p>
        </div>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${appUrl}/projects/${projectId}"
             style="background: #1a1a1a; color: #a855f7; border: 1px solid #a855f7; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Track Progress
          </a>
        </div>
        <p style="color: #555; font-size: 12px; text-align: center;">Song2Video AI</p>
      </body>
      </html>
    `,
  }).catch((err) => {
    console.error('[Notification] Failed to send started email:', err)
  })
}
