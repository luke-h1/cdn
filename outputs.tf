output "bucket_name" {
  value = aws_s3_bucket.cdn.bucket
}

output "bucket_arn" {
  value = aws_s3_bucket.cdn.arn
}

output "bucket_region" {
  value = aws_s3_bucket.cdn.region
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.links.name
}

output "dynamodb_table_arn" {
  value = aws_dynamodb_table.links.arn
}
