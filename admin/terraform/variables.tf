variable "bucket_name" {
  description = "S3 bucket name the IAM user can manage"
  type        = string
  default     = "lho-cdn"
}

variable "iam_user_name" {
  description = "Name of the IAM user for CDN admin"
  type        = string
  default     = "cdn-admin"
}

variable "aws_region" {
  description = "AWS region (e.g. eu-west-2 for London)"
  type        = string
  default     = "eu-west-2"
}
