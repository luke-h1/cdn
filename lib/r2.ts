import { getCloudflareContext } from "@opennextjs/cloudflare";

interface R2ApiObject {
  key: string;
  size: number;
  uploaded: string;
  etag: string;
  httpEtag: string;
  version: string;
}

interface R2ListResponse {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: {
    objects: R2ApiObject[];
    truncated: boolean;
    cursor?: string;
  };
}

interface R2ObjectResponse {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: R2ApiObject;
}

export interface R2ObjectMeta {
  Key: string;
  Size: number;
  LastModified: Date;
  ETag: string;
}

export interface R2GetResult {
  body: ReadableStream | ArrayBuffer;
  contentType: string;
  contentLength: number;
  etag: string;
}

function getR2Bucket(): R2Bucket | null {
  try {
    const ctx = getCloudflareContext();
    return ctx?.env?.R2_BUCKET ?? null;
  } catch {
    return null;
  }
}

function getConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET_NAME ?? process.env.R2_BUCKET;
  const apiToken = process.env.R2_API_TOKEN;

  if (!accountId)
    throw new Error("CLOUDFLARE_ACCOUNT_ID environment variable is required");
  if (!bucket) throw new Error("R2_BUCKET environment variable is required");
  if (!apiToken)
    throw new Error("R2_API_TOKEN environment variable is required");

  return { accountId, bucket, apiToken };
}

function getBaseUrl() {
  const { accountId, bucket } = getConfig();
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}`;
}

function getHeaders() {
  const { apiToken } = getConfig();
  return {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  };
}

export async function listObjects(prefix = "", maxKeys = 1000) {
  const bucket = getR2Bucket();

  if (bucket) {
    const listed = await bucket.list({
      prefix: prefix || undefined,
      limit: maxKeys,
    });

    const contents = listed.objects.map((obj: R2Object) => ({
      Key: obj.key,
      Size: obj.size,
      LastModified: obj.uploaded,
      ETag: obj.etag,
    }));

    return {
      contents,
      isTruncated: listed.truncated,
      keyCount: contents.length,
    };
  }

  const url = new URL(`${getBaseUrl()}/objects`);
  if (prefix) url.searchParams.set("prefix", prefix);
  url.searchParams.set("limit", String(maxKeys));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`R2 API error (${response.status}): ${text}`);
  }

  const data: R2ListResponse = await response.json();

  if (!data.success) {
    const errorMsg = data.errors.map((e) => e.message).join(", ");
    throw new Error(`R2 list failed: ${errorMsg}`);
  }

  const contents = data.result.objects.map((obj) => ({
    Key: obj.key,
    Size: obj.size,
    LastModified: new Date(obj.uploaded),
    ETag: obj.etag,
  }));

  return {
    contents,
    isTruncated: data.result.truncated,
    keyCount: contents.length,
  };
}

export async function uploadObject(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType?: string,
) {
  const bucket = getR2Bucket();

  if (bucket) {
    await bucket.put(key, body, {
      httpMetadata: contentType ? { contentType } : undefined,
    });
    return { key };
  }

  const { accountId, bucket: bucketName, apiToken } = getConfig();
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${encodeURIComponent(key)}`;

  const response = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": contentType ?? "application/octet-stream",
    },
    body: body as unknown as BodyInit,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`R2 upload error (${response.status}): ${text}`);
  }

  return { key };
}

export async function deleteObject(key: string) {
  const bucket = getR2Bucket();

  if (bucket) {
    await bucket.delete(key);
    return { key };
  }

  const url = `${getBaseUrl()}/objects/${encodeURIComponent(key)}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`R2 delete error (${response.status}): ${text}`);
  }

  return { key };
}

export async function copyObject(oldKey: string, newKey: string) {
  const bucket = getR2Bucket();

  if (bucket) {
    const obj = await bucket.get(oldKey);
    if (!obj) {
      throw new Error(`Object not found: ${oldKey}`);
    }

    const body = await obj.arrayBuffer();
    await bucket.put(newKey, body, {
      httpMetadata: obj.httpMetadata,
      customMetadata: obj.customMetadata,
    });
    await bucket.delete(oldKey);
    return { key: newKey };
  }

  const { accountId, bucket: bucketName, apiToken } = getConfig();

  const downloadUrl = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${encodeURIComponent(oldKey)}`;
  const downloadResponse = await fetch(downloadUrl, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (!downloadResponse.ok) {
    throw new Error(
      `R2 download error (${downloadResponse.status}): ${await downloadResponse.text()}`,
    );
  }

  const contentType =
    downloadResponse.headers.get("content-type") ?? "application/octet-stream";
  const body = Buffer.from(await downloadResponse.arrayBuffer());

  await uploadObject(newKey, body, contentType);
  await deleteObject(oldKey);

  return { key: newKey };
}

export async function headObject(key: string) {
  const bucket = getR2Bucket();

  if (bucket) {
    const obj = await bucket.head(key);
    if (!obj) {
      throw new Error("R2 head error: Not found");
    }

    return {
      contentType: obj.httpMetadata?.contentType ?? "application/octet-stream",
      contentLength: obj.size,
      lastModified: obj.uploaded,
      metadata: obj.customMetadata ?? {},
    };
  }

  const url = `${getBaseUrl()}/objects/${encodeURIComponent(key)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`R2 head error (${response.status}): Not found`);
  }

  const data: R2ObjectResponse = await response.json();

  if (!data.success) {
    const errorMsg = data.errors.map((e) => e.message).join(", ");
    throw new Error(`R2 head failed: ${errorMsg}`);
  }

  return {
    contentType: "application/octet-stream",
    contentLength: data.result.size,
    lastModified: new Date(data.result.uploaded),
    metadata: {},
  };
}

export async function getObject(key: string): Promise<R2GetResult | null> {
  const bucket = getR2Bucket();

  if (bucket) {
    const obj = await bucket.get(key);
    if (!obj) {
      return null;
    }

    return {
      body: obj.body,
      contentType: obj.httpMetadata?.contentType ?? "application/octet-stream",
      contentLength: obj.size,
      etag: obj.etag,
    };
  }

  const { accountId, bucket: bucketName, apiToken } = getConfig();

  const downloadUrl = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${encodeURIComponent(key)}`;
  const response = await fetch(downloadUrl, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(
      `R2 get error (${response.status}): ${await response.text()}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    body: arrayBuffer,
    contentType:
      response.headers.get("content-type") ?? "application/octet-stream",
    contentLength: arrayBuffer.byteLength,
    etag: response.headers.get("etag") ?? "",
  };
}
