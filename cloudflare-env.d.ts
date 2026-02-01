/// <reference types="@cloudflare/workers-types" />

// Generated Cloudflare environment types
// Run `bun run cf-typegen` to regenerate after wrangler.toml changes

interface CloudflareEnv {
  // R2 bucket binding for private file storage
  R2_BUCKET: R2Bucket;

  // D1 database binding for link shortener
  D1_DATABASE: D1Database;

  // Static assets binding (managed by OpenNext)
  ASSETS: Fetcher;

  // Environment variables
  NEXT_PUBLIC_CDN_URL?: string;

  // Legacy environment variables (for fallback/local dev)
  CLOUDFLARE_ACCOUNT_ID?: string;
  R2_BUCKET_NAME?: string;
  R2_API_TOKEN?: string;
  D1_DATABASE_ID?: string;
  D1_API_TOKEN?: string;
}

// Augment the module from @opennextjs/cloudflare
declare module "@opennextjs/cloudflare" {
  export function getCloudflareContext(): {
    env: CloudflareEnv;
    cf: CfProperties;
    ctx: ExecutionContext;
  };
  export function initOpenNextCloudflareForDev(options?: {
    experimental?: { remoteBindings?: boolean };
  }): void;
}

export {};
