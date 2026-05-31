import { Queue } from 'bullmq'

const connection = { url: process.env.REDIS_URL ?? 'redis://localhost:6379' }

export const pipelineQueue = new Queue('pipeline', { connection })
export const transcriptionQueue = new Queue('transcription', { connection })
export const analysisQueue = new Queue('analysis', { connection })
export const storyboardQueue = new Queue('storyboard', { connection })
export const videoGenQueue = new Queue('video-gen', { connection })
export const renderQueue = new Queue('render', { connection })
