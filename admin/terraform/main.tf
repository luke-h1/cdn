terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version  = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_iam_user" "cdn_admin" {
  name = var.iam_user_name
  path = "/"
}

resource "aws_iam_user_policy" "cdn_bucket" {
  name   = "cdn-bucket-admin"
  user   = aws_iam_user.cdn_admin.name
  policy = data.aws_iam_policy_document.cdn_bucket.json
}

data "aws_iam_policy_document" "cdn_bucket" {
  statement {
    sid    = "ListBucket"
    effect = "Allow"
    actions = ["s3:ListBucket"]
    resources = [
      "arn:aws:s3:::${var.bucket_name}"
    ]
  }

  statement {
    sid    = "ObjectOperations"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:GetObjectVersion",
      "s3:CopyObject"
    ]
    resources = [
      "arn:aws:s3:::${var.bucket_name}/*"
    ]
  }
}

resource "aws_iam_access_key" "cdn_admin" {
  user = aws_iam_user.cdn_admin.name
}
