/**
 * S3-compatible client. Works with AWS S3, Cloudflare R2, MinIO, etc.
 * `S3_ENDPOINT` is optional — set it for non-AWS providers.
 */
import "server-only";
import { S3Client } from "@aws-sdk/client-s3";
import { serverEnv } from "@/lib/env";

let _client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (_client) return _client;
  if (!serverEnv.S3_REGION || !serverEnv.S3_ACCESS_KEY_ID || !serverEnv.S3_SECRET_ACCESS_KEY) {
    throw new Error("S3 not configured — set S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY");
  }
  _client = new S3Client({
    region: serverEnv.S3_REGION,
    endpoint: serverEnv.S3_ENDPOINT,
    // R2 / MinIO use path-style URLs by default; harmless on AWS.
    forcePathStyle: Boolean(serverEnv.S3_ENDPOINT),
    credentials: {
      accessKeyId: serverEnv.S3_ACCESS_KEY_ID,
      secretAccessKey: serverEnv.S3_SECRET_ACCESS_KEY,
    },
  });
  return _client;
}

export function getBucket(): string {
  if (!serverEnv.S3_BUCKET) throw new Error("S3_BUCKET is not configured");
  return serverEnv.S3_BUCKET;
}

export function getPublicUrl(key: string): string {
  if (serverEnv.S3_PUBLIC_URL_BASE) {
    return `${serverEnv.S3_PUBLIC_URL_BASE.replace(/\/$/, "")}/${key}`;
  }
  if (serverEnv.S3_ENDPOINT) {
    return `${serverEnv.S3_ENDPOINT.replace(/\/$/, "")}/${getBucket()}/${key}`;
  }
  return `https://${getBucket()}.s3.${serverEnv.S3_REGION}.amazonaws.com/${key}`;
}
