import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

const region = process.env.S3_REGION ?? process.env.AWS_REGION ?? "eu-west-2";

function getBucket(): string {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET environment variable is required");
  return bucket;
}

export const s3 = new S3Client({
  region,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

export async function listObjects(prefix = "", maxKeys = 1000) {
  const command = new ListObjectsV2Command({
    Bucket: getBucket(),
    Prefix: prefix,
    MaxKeys: maxKeys,
  });
  const response = await s3.send(command);
  return {
    contents: response.Contents ?? [],
    isTruncated: response.IsTruncated ?? false,
    keyCount: response.KeyCount ?? 0,
  };
}

export async function uploadObject(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType?: string,
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType ?? "application/octet-stream",
    }),
  );
  return { key };
}

export async function deleteObject(key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    }),
  );
  return { key };
}

export async function copyObject(oldKey: string, newKey: string) {
  const bucket = getBucket();
  await s3.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${encodeURIComponent(oldKey)}`,
      Key: newKey,
    }),
  );
  await deleteObject(oldKey);
  return { key: newKey };
}

export async function headObject(key: string) {
  const response = await s3.send(
    new HeadObjectCommand({
      Bucket: getBucket(),
      Key: key,
    }),
  );
  return {
    contentType: response.ContentType,
    contentLength: response.ContentLength,
    lastModified: response.LastModified,
    metadata: response.Metadata ?? {},
  };
}
