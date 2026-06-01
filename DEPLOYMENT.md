# Song2Video AI — Deployment Guide

## Services Required

| Service | Purpose | Free tier? |
|---------|---------|-----------|
| Vercel | Next.js hosting | Yes |
| Railway | Worker + Postgres + Redis | $5/mo |
| AWS S3 | File storage | Pay-per-use |
| Clerk | Authentication | Yes (10k MAU) |
| OpenAI | Whisper + GPT-4 + DALL-E | Pay-per-use |
| Stripe | Payments | Free until revenue |
| Resend | Email | Yes (3k/mo) |
| Upstash | Rate limiting Redis | Yes (10k/day) |
| Sentry | Error monitoring | Yes |

## Step 1: Database (Railway)

1. Create a Railway project
2. Add PostgreSQL plugin
3. Add Redis plugin
4. Copy `DATABASE_URL` and `REDIS_URL` from Railway dashboard

## Step 2: AWS S3

1. Create an S3 bucket: `song2video-uploads`
2. Set bucket region to `us-east-1`
3. Add CORS policy:
```json
[{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["PUT", "GET"],
  "AllowedOrigins": ["https://yourdomain.com"],
  "MaxAgeSeconds": 3000
}]
```
4. Create IAM user with S3 full access, copy access keys

## Step 3: Clerk

1. Create a Clerk application
2. Copy publishable key and secret key
3. Add webhook endpoint: `https://yourdomain.com/api/auth/webhook`
4. Select `user.created` event, copy signing secret

## Step 4: Stripe

1. Create Stripe account
2. Copy secret key and publishable key
3. Add webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Select `checkout.session.completed` event, copy signing secret

## Step 5: Deploy Worker (Railway)

1. In the same Railway project, add a new service from GitHub repo
2. Set `Dockerfile Path` to `Dockerfile.worker`
3. Add all environment variables from `.env.example`
4. Set `DATABASE_URL` and `REDIS_URL` to the Railway internal URLs

## Step 6: Deploy App (Vercel)

1. Import GitHub repo to Vercel
2. Framework: Next.js (auto-detected)
3. Add all environment variables
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel domain
5. Deploy

## Step 7: Run Migrations

After first deploy, run from Railway console or locally with production DATABASE_URL:
```bash
npx prisma migrate deploy
```

## Environment Variables Checklist

Copy `.env.example` and fill in all values before deploying.

Key variables that MUST be set for production:
- `DATABASE_URL` — Railway Postgres
- `REDIS_URL` — Railway Redis
- `CLERK_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_WEBHOOK_SECRET`
- `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` + `S3_BUCKET_NAME`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL` — your production URL
- `ADMIN_EMAILS` — comma-separated admin email addresses
