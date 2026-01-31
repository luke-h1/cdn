output "access_key_id" {
  description = "AWS_ACCESS_KEY_ID for the CDN admin user"
  value       = aws_iam_access_key.cdn_admin.id
}

output "secret_access_key" {
  description = "AWS_SECRET_ACCESS_KEY for the CDN admin user (sensitive)"
  value       = aws_iam_access_key.cdn_admin.secret
  sensitive   = true
}

output "iam_user_arn" {
  description = "ARN of the created IAM user"
  value       = aws_iam_user.cdn_admin.arn
}
