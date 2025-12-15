variable "bucket_name" {
  description = "Name of the S3 bucket for static file hosting"
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

variable "aws_region" {
  description = "AWS region for the S3 bucket"
  type        = string
  default     = "eu-west-2"
}

variable "cloudflare_proxied" {
  description = "Whether Cloudflare should proxy traffic (enables CDN caching)"
  type        = bool
  default     = true
}

variable "cache_ttl" {
  description = "Browser cache TTL in seconds"
  type        = number
  default     = 86400
}

variable "tags" {
  description = "Tags to apply to AWS resources"
  type        = map(string)
  default     = {}
}

variable "cors_allowed_origins" {
  description = "List of allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}

variable "cors_allowed_methods" {
  description = "List of allowed HTTP methods for CORS"
  type        = list(string)
  default     = ["GET", "HEAD"]
}


variable "cloudflare_api_token" {
  type        = string
  description = "The cloudflare API token to use"
}

variable "zone_id" {
  type        = string
  description = "AWS hosted zone ID"
}

variable "project_name" {
  type    = string
  default = "lho-cdn"
}

variable "env" {
  type    = string
  default = "production"
}
