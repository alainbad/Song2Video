import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
})

export async function getPresignedUploadUrl(key: string, contentType: string) {
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 300 }
  )
}

export async function getPresignedDownloadUrl(key: string) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    }),
    { expiresIn: 86400 }
  )
}

export function getS3Key(prefix: string, id: string, filename: string) {
  return `${prefix}/${id}/${filename}`
}

export function getS3Url(key: string) {
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION ?? 'us-east-1'}.amazonaws.com/${key}`
}
