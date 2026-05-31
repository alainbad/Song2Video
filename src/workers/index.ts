import { Worker, type Job } from 'bullmq'

const connection = { url: process.env.REDIS_URL ?? 'redis://localhost:6379' }

async function processPipeline(job: Job<{ projectId: string; userId: string; songDuration: number }>) {
  const { processPipeline: handler } = await import('./pipeline.worker')
  return handler(job)
}

const worker = new Worker('pipeline', processPipeline, {
  connection,
  concurrency: parseInt(process.env.WORKER_CONCURRENCY ?? '3'),
})

worker.on('completed', (job) => console.log(`[Worker] Job ${job.id} completed for project ${job.data.projectId}`))
worker.on('failed', (job, err) => console.error(`[Worker] Job ${job?.id} failed:`, err.message))
worker.on('error', (err) => console.error('[Worker] Worker error:', err))

console.log('[Worker] Pipeline worker started')
process.on('SIGTERM', async () => { await worker.close(); process.exit(0) })
