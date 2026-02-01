import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { LinkRecord } from "@/types/bucket";

export type { LinkRecord };

interface D1ApiResponse<T = unknown> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: Array<{
    success: boolean;
    results: T[];
    meta: {
      changes: number;
      duration: number;
      last_row_id: number;
      served_by: string;
    };
  }>;
}

function getD1Database(): D1Database | null {
  try {
    const ctx = getCloudflareContext();
    return ctx?.env?.D1_DATABASE ?? null;
  } catch {
    return null;
  }
}

function getConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.D1_DATABASE_ID;
  const apiToken = process.env.D1_API_TOKEN;

  if (!accountId)
    throw new Error("CLOUDFLARE_ACCOUNT_ID environment variable is required");
  if (!databaseId)
    throw new Error("D1_DATABASE_ID environment variable is required");
  if (!apiToken)
    throw new Error("D1_API_TOKEN environment variable is required");

  return { accountId, databaseId, apiToken };
}

async function executeQuery<T = unknown>(
  sql: string,
  params: (string | number | null)[] = [],
): Promise<T[]> {
  const db = getD1Database();

  if (db) {
    const stmt = db.prepare(sql);
    const result = await stmt.bind(...params).all<T>();
    return result.results ?? [];
  }

  const { accountId, databaseId, apiToken } = getConfig();
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`D1 API error (${response.status}): ${text}`);
  }

  const data: D1ApiResponse<T> = await response.json();

  if (!data.success) {
    const errorMsg = data.errors.map((e) => e.message).join(", ");
    throw new Error(`D1 query failed: ${errorMsg}`);
  }

  return data.result[0]?.results ?? [];
}

export async function putLink(
  shortCode: string,
  longUrl: string,
): Promise<LinkRecord> {
  const now = new Date().toISOString();

  const existing = await getLink(shortCode);
  if (existing) {
    throw new Error("shortCode already exists");
  }

  await executeQuery(
    "INSERT INTO links (shortCode, longUrl, createdAt) VALUES (?, ?, ?)",
    [shortCode, longUrl, now],
  );

  return { shortCode, longUrl, createdAt: now };
}

export async function putLinkOverwrite(
  shortCode: string,
  longUrl: string,
): Promise<LinkRecord> {
  const now = new Date().toISOString();

  await executeQuery(
    "INSERT OR REPLACE INTO links (shortCode, longUrl, createdAt) VALUES (?, ?, ?)",
    [shortCode, longUrl, now],
  );

  return { shortCode, longUrl, createdAt: now };
}

export async function getLink(shortCode: string): Promise<LinkRecord | null> {
  const results = await executeQuery<LinkRecord>(
    "SELECT shortCode, longUrl, createdAt FROM links WHERE shortCode = ?",
    [shortCode],
  );

  return results[0] ?? null;
}

export async function listLinks(): Promise<LinkRecord[]> {
  return executeQuery<LinkRecord>(
    "SELECT shortCode, longUrl, createdAt FROM links ORDER BY createdAt DESC",
  );
}

export async function deleteLink(shortCode: string): Promise<void> {
  await executeQuery("DELETE FROM links WHERE shortCode = ?", [shortCode]);
}

export async function initializeDatabase(): Promise<void> {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS links (
      shortCode TEXT PRIMARY KEY,
      longUrl TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  await executeQuery(
    "CREATE INDEX IF NOT EXISTS idx_links_createdAt ON links(createdAt)",
  );
}
