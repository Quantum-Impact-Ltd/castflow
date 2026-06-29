import { S3Client } from '@aws-sdk/client-s3'
import { env } from './env'

// Jurisdiction-scoped buckets (EU data residency, FedRAMP) are only reachable
// on a jurisdiction-specific S3 host — the default host returns AccessDenied
// for them. Inject the segment when R2_JURISDICTION is set.
const r2Host = env.R2_JURISDICTION
  ? `${env.R2_ACCOUNT_ID}.${env.R2_JURISDICTION}.r2.cloudflarestorage.com`
  : `${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${r2Host}`,
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
