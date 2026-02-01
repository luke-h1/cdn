import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";

export interface S3ObjectMeta {
  Key: string;
  Size: number;
  LastModified: Date;
  ETag: string;
}

export interface S3GetResult {
  body: ReadableStream | ArrayBuffer;
  contentType: string;
  contentLength: number;
  etag: string;
}

function getConfig() {
  const bucket = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION || "eu-west-2";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!bucket)
    throw new Error("S3_BUCKET_NAME environment variable is required");
  if (!accessKeyId)
    throw new Error("AWS_ACCESS_KEY_ID environment variable is required");
  if (!secretAccessKey)
    throw new Error("AWS_SECRET_ACCESS_KEY environment variable is required");

  return { bucket, region, accessKeyId, secretAccessKey };
}

export function getPublicUrl(key: string): string {
  const rawCdnUrl = process.env.NEXT_PUBLIC_CDN_URL;
  const cdnUrl =
    rawCdnUrl && !rawCdnUrl.startsWith("http")
      ? `https://${rawCdnUrl}`
      : rawCdnUrl;

  if (cdnUrl) {
    return `${cdnUrl.replace(/\/$/, "")}/${key}`;
  }

  const { bucket, region } = getConfig();
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

function getClient() {
  const { region, accessKeyId, secretAccessKey } = getConfig();

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function listObjects(prefix = "", maxKeys = 1000) {
  const { bucket } = getConfig();
  const client = getClient();

  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix || undefined,
    MaxKeys: maxKeys,
  });

  const response = await client.send(command);

  const contents = (response.Contents ?? []).map((obj) => ({
    Key: obj.Key ?? "",
    Size: obj.Size ?? 0,
    LastModified: obj.LastModified ?? new Date(),
    ETag: obj.ETag ?? "",
  }));

  return {
    contents,
    isTruncated: response.IsTruncated ?? false,
    keyCount: contents.length,
  };
}

export async function uploadObject(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType?: string,
) {
  const { bucket } = getConfig();
  const client = getClient();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType ?? "application/octet-stream",
  });

  await client.send(command);

  return { key };
}

export async function deleteObject(key: string) {
  const { bucket } = getConfig();
  const client = getClient();

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await client.send(command);

  return { key };
}

export async function copyObject(oldKey: string, newKey: string) {
  const { bucket } = getConfig();
  const client = getClient();

  const copyCommand = new CopyObjectCommand({
    Bucket: bucket,
    CopySource: `${bucket}/${oldKey}`,
    Key: newKey,
  });

  await client.send(copyCommand);

  const deleteCommand = new DeleteObjectCommand({
    Bucket: bucket,
    Key: oldKey,
  });

  await client.send(deleteCommand);

  return { key: newKey };
}

export async function headObject(key: string) {
  const { bucket } = getConfig();
  const client = getClient();

  const command = new HeadObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await client.send(command);

  return {
    contentType: response.ContentType ?? "application/octet-stream",
    contentLength: response.ContentLength ?? 0,
    lastModified: response.LastModified ?? new Date(),
    metadata: response.Metadata ?? {},
  };
}

export async function getObject(key: string): Promise<S3GetResult | null> {
  const { bucket } = getConfig();
  const client = getClient();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  try {
    const response = await client.send(command);

    if (!response.Body) {
      return null;
    }

    const arrayBuffer = await response.Body.transformToByteArray();

    return {
      body: arrayBuffer.buffer as ArrayBuffer,
      contentType: response.ContentType ?? "application/octet-stream",
      contentLength: response.ContentLength ?? arrayBuffer.byteLength,
      etag: response.ETag ?? "",
    };
  } catch (error) {
    if (
      error instanceof Error &&
      "name" in error &&
      error.name === "NoSuchKey"
    ) {
      return null;
    }
    throw error;
  }
}
