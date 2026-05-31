import ffmpeg from 'fluent-ffmpeg'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { s3, getS3Url } from '@/lib/s3'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '@/lib/prisma'

async function downloadS3File(url: string, destPath: string): Promise<void> {
  const key = new URL(url).pathname.slice(1)
  const response = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: key }))
  if (!response.Body) throw new Error(`Failed to download ${key}`)
  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) chunks.push(chunk)
  fs.writeFileSync(destPath, Buffer.concat(chunks))
}

function createClip(imagePath: string, outputPath: string, duration: number): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(imagePath)
      .inputOptions(['-loop 1'])
      .videoFilters([
        'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080',
        `zoompan=z='min(zoom+0.0008,1.3)':d=${Math.round(duration * 25)}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080`,
        'fps=25',
      ])
      .outputOptions([`-t ${duration}`, '-vcodec libx264', '-crf 23', '-preset fast', '-pix_fmt yuv420p'])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run()
  })
}

export async function assembleVideo(projectId: string): Promise<string> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { song: true, videoScenes: { orderBy: { sceneOrder: 'asc' } } },
  })
  if (!project?.song) throw new Error('Project or song not found')

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `s2v-${projectId}-`))

  try {
    const audioPath = path.join(tmpDir, 'audio.mp3')
    await downloadS3File(project.song.fileUrl, audioPath)

    const clipPaths: string[] = []
    for (const scene of project.videoScenes) {
      if (!scene.imageUrl) continue
      const imagePath = path.join(tmpDir, `img_${scene.sceneOrder}.jpg`)
      await downloadS3File(scene.imageUrl, imagePath)
      const clipPath = path.join(tmpDir, `clip_${scene.sceneOrder}.mp4`)
      await createClip(imagePath, clipPath, scene.duration ?? 15)
      clipPaths.push(clipPath)
    }

    if (clipPaths.length === 0) throw new Error('No scene clips generated')

    const concatPath = path.join(tmpDir, 'concat.txt')
    fs.writeFileSync(concatPath, clipPaths.map((p) => `file '${p}'`).join('\n'))

    const concatOutput = path.join(tmpDir, 'concat.mp4')
    await new Promise<void>((resolve, reject) => {
      ffmpeg().input(concatPath).inputOptions(['-f concat', '-safe 0']).outputOptions(['-c copy']).output(concatOutput)
        .on('end', () => resolve()).on('error', reject).run()
    })

    const finalPath = path.join(tmpDir, 'final.mp4')
    await new Promise<void>((resolve, reject) => {
      ffmpeg().input(concatOutput).input(audioPath)
        .outputOptions(['-map 0:v:0', '-map 1:a:0', '-vcodec libx264', '-crf 23', '-preset medium', '-acodec aac', '-b:a 192k', '-shortest', '-movflags +faststart'])
        .output(finalPath).on('end', () => resolve()).on('error', reject).run()
    })

    const s3Key = `videos/${projectId}/final.mp4`
    const videoBuffer = fs.readFileSync(finalPath)
    await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: s3Key, Body: videoBuffer, ContentType: 'video/mp4' }))

    const downloadUrl = getS3Url(s3Key)
    await prisma.finalVideo.upsert({
      where: { projectId },
      create: { projectId, downloadUrl, resolution: '1920x1080', fileSize: BigInt(videoBuffer.length) },
      update: { downloadUrl, fileSize: BigInt(videoBuffer.length) },
    })

    return downloadUrl
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}
