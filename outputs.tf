output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.static.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.static.arn
}

output "bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket"
  value       = aws_s3_bucket.static.bucket_regional_domain_name
}

output "website_endpoint" {
  description = "S3 static website endpoint"
  value       = aws_s3_bucket_website_configuration.static.website_endpoint
}

output "cdn_url" {
  description = "CDN URL for accessing static files"
  value       = "https://${var.domain}"
}

output "cloudflare_record_id" {
  description = "Cloudflare DNS record ID"
  value       = cloudflare_record.cdn.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.static.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.static.domain_name
}
