import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} in .env.local`);
  }
  return value;
}

/**
 * S3-compatible client pointed at your R2 bucket. Only import this from
 * server-side code (API routes) — it uses the R2 secret key.
 */
export function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: getEnv('R2_ENDPOINT'),
    credentials: {
      accessKeyId: getEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: getEnv('R2_SECRET_ACCESS_KEY'),
    },
  });
}

/** Upload a file buffer to R2 under the given storage key. */
export async function uploadToR2(
  storageKey: string,
  body: Buffer | Uint8Array,
  contentType: string
) {
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getEnv('R2_BUCKET_NAME'),
      Key: storageKey,
      Body: body,
      ContentType: contentType,
    })
  );
}

/** Generate a time-limited signed URL so the browser can download directly from R2. */
export async function getR2DownloadUrl(storageKey: string, expiresInSeconds = 300) {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: getEnv('R2_BUCKET_NAME'),
    Key: storageKey,
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Generate a time-limited signed URL so the browser can PUT the file bytes
 * directly to R2 — bypassing Vercel's ~4.5MB serverless request body limit
 * entirely, since the file never passes through our server.
 */
export async function getR2UploadUrl(
  storageKey: string,
  contentType: string,
  expiresInSeconds = 600
) {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: getEnv('R2_BUCKET_NAME'),
    Key: storageKey,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/** Permanently delete a file from R2 — used by the expiry cleanup job. */
export async function deleteFromR2(storageKey: string) {
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: getEnv('R2_BUCKET_NAME'),
      Key: storageKey,
    })
  );
}