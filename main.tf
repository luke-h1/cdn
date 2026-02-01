provider "cloudflare" {
  api_token = var.cloudflare_api_token
}


resource "cloudflare_r2_bucket" "cdn" {
  account_id = var.cloudflare_account_id
  name       = var.bucket_name
  location   = var.r2_location
}

resource "cloudflare_d1_database" "links" {
  account_id = var.cloudflare_account_id
  name       = var.d1_database_name
}

resource "cloudflare_ruleset" "cache_rules" {
  zone_id = var.cloudflare_zone_id
  name    = "${var.bucket_name}-cache-rules"
  kind    = "zone"
  phase   = "http_request_cache_settings"

  rules {
    action = "set_cache_settings"
    action_parameters {
      cache = true
      edge_ttl {
        mode = "respect_origin"
      }
      browser_ttl {
        mode = "respect_origin"
      }
    }
    expression  = "(http.host eq \"${var.domain}\" and http.request.uri.path.extension in {\"jpg\" \"jpeg\" \"png\" \"webp\" \"gif\" \"svg\" \"ico\" \"avif\"})"
    description = "Cache images for CDN"
    enabled     = true
  }

  rules {
    action = "set_cache_settings"
    action_parameters {
      cache = true
      edge_ttl {
        mode = "respect_origin"
      }
      browser_ttl {
        mode = "respect_origin"
      }
    }
    expression  = "(http.host eq \"${var.domain}\" and http.request.uri.path.extension in {\"css\" \"js\" \"woff\" \"woff2\" \"ttf\" \"eot\" \"otf\"})"
    description = "Cache static assets for CDN"
    enabled     = true
  }

  rules {
    action = "set_cache_settings"
    action_parameters {
      cache = true
      edge_ttl {
        mode = "respect_origin"
      }
      browser_ttl {
        mode = "respect_origin"
      }
    }
    expression  = "(http.host eq \"${var.domain}\" and http.request.uri.path.extension in {\"json\" \"xml\" \"txt\" \"pdf\" \"zip\"})"
    description = "Cache documents for CDN"
    enabled     = true
  }
}

resource "cloudflare_ruleset" "transform_headers" {
  zone_id = var.cloudflare_zone_id
  name    = "${var.bucket_name}-cors-headers"
  kind    = "zone"
  phase   = "http_response_headers_transform"

  rules {
    action = "rewrite"
    action_parameters {
      headers {
        name      = "Access-Control-Allow-Origin"
        operation = "set"
        value     = "*"
      }
      headers {
        name      = "Access-Control-Allow-Methods"
        operation = "set"
        value     = "GET, HEAD, OPTIONS"
      }
      headers {
        name      = "Access-Control-Expose-Headers"
        operation = "set"
        value     = "ETag"
      }
    }
    expression  = "(http.host eq \"${var.domain}\")"
    description = "CORS headers for CDN"
    enabled     = true
  }
}


resource "cloudflare_api_token" "r2_token" {
  name = "${var.bucket_name}-r2-access"

  policy {
    permission_groups = [
      data.cloudflare_api_token_permission_groups.all.r2["Workers R2 Storage Bucket Item Write"],
      data.cloudflare_api_token_permission_groups.all.r2["Workers R2 Storage Bucket Item Read"],
    ]
    resources = {
      "com.cloudflare.edge.r2.bucket.${var.cloudflare_account_id}_default_${var.bucket_name}" = "*"
    }
  }
}

resource "cloudflare_api_token" "d1_token" {
  name = "${var.d1_database_name}-d1-access"

  policy {
    permission_groups = [
      data.cloudflare_api_token_permission_groups.all.account["D1 Write"],
    ]
    resources = {
      "com.cloudflare.api.account.${var.cloudflare_account_id}" = "*"
    }
  }
}

data "cloudflare_api_token_permission_groups" "all" {}

# D1 database initialization SQL
# Run this manually: wrangler d1 execute <db-name> --command "<sql>"
locals {
  d1_init_sql = <<-SQL
    CREATE TABLE IF NOT EXISTS links (
      shortCode TEXT PRIMARY KEY,
      longUrl TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_links_createdAt ON links(createdAt);
  SQL

  # Wrangler configuration values for deployment
  wrangler_config = {
    worker_name   = var.project_name
    bucket_name   = cloudflare_r2_bucket.cdn.name
    database_name = cloudflare_d1_database.links.name
    database_id   = cloudflare_d1_database.links.id
    domain        = var.domain
  }
}
