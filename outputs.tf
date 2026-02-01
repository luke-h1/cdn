output "bucket_name" {
  description = "Name of the R2 bucket (private, accessed only through Worker)"
  value       = cloudflare_r2_bucket.cdn.name
}

output "r2_endpoint" {
  description = "R2 S3-compatible API endpoint (for local development fallback)"
  value       = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
}

output "r2_access_key_id" {
  description = "R2 Access Key ID for S3-compatible API (local development)"
  value       = cloudflare_api_token.r2_token.id
}

output "r2_secret_access_key" {
  description = "R2 Secret Access Key for S3-compatible API (local development)"
  value       = cloudflare_api_token.r2_token.value
  sensitive   = true
}

output "d1_database_id" {
  description = "D1 database ID (needed for wrangler.toml)"
  value       = cloudflare_d1_database.links.id
}

output "d1_database_name" {
  description = "D1 database name"
  value       = cloudflare_d1_database.links.name
}

output "d1_api_token" {
  description = "D1 API token for REST API access (local development)"
  value       = cloudflare_api_token.d1_token.value
  sensitive   = true
}


output "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  value       = var.cloudflare_account_id
}


output "cdn_url" {
  description = "CDN URL for accessing files (served through Cloudflare Worker)"
  value       = "https://${var.domain}"
}

output "worker_name" {
  description = "Name of the Cloudflare Worker"
  value       = var.project_name
}

output "wrangler_config" {
  description = "Configuration values for wrangler.toml"
  value = {
    name          = var.project_name
    bucket_name   = cloudflare_r2_bucket.cdn.name
    database_name = cloudflare_d1_database.links.name
    database_id   = cloudflare_d1_database.links.id
    domain        = var.domain
  }
}

output "d1_init_sql" {
  description = "SQL to initialize the D1 database tables"
  value       = local.d1_init_sql
}

output "env_file_content" {
  description = "Content for .env file (local development)"
  sensitive   = true
  value       = <<-EOT
    # Cloudflare Account
    CLOUDFLARE_ACCOUNT_ID=${var.cloudflare_account_id}

    # R2 Bucket (for local development REST API fallback)
    R2_BUCKET_NAME=${cloudflare_r2_bucket.cdn.name}
    R2_API_TOKEN=${cloudflare_api_token.r2_token.value}

    # D1 Database (for local development REST API fallback)
    D1_DATABASE_ID=${cloudflare_d1_database.links.id}
    D1_API_TOKEN=${cloudflare_api_token.d1_token.value}

    # Public CDN URL
    NEXT_PUBLIC_CDN_URL=https://${var.domain}
  EOT
}
