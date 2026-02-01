variable "bucket_name" {
  description = "Name of the R2 bucket for static file hosting"
  type        = string
  default     = "lho-cdn"
}

variable "domain" {
  description = "Domain name for the CDN (e.g., cdn.example.com)"
  type        = string
  default     = "cdn.lhowsam.com"
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for the domain"
  type        = string
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with permissions for R2, D1, and DNS"
  type        = string
  sensitive   = true
}

variable "r2_location" {
  description = "R2 bucket location hint (e.g., 'WEUR' for Western Europe)"
  type        = string
  default     = "WEUR"
}

variable "d1_database_name" {
  description = "D1 database name for link shortener"
  type        = string
  default     = "lho-cdn-links"
}

variable "project_name" {
  type    = string
  default = "lho-cdn"
}

variable "env" {
  type    = string
  default = "production"
}
