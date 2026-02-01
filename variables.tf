variable "aws_region" {
  type    = string
  default = "eu-west-2"
}

variable "bucket_name" {
  type    = string
  default = "lho-cdn-priv"
}

variable "dynamodb_table_name" {
  type    = string
  default = "lho-cdn-links"
}
