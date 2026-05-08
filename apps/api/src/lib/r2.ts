import { S3Client } from '@aws-sdk/client-s3'
import { env } from './env'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
})

export const Buckets = {
  public: env.R2_PUBLIC_BUCKET,
  private: env.R2_PRIVATE_BUCKET,
  contracts: env.R2_CONTRACTS_BUCKET,
} as const
