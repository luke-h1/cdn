terraform {
  required_version = ">= 1.5.0"

  backend "s3" {
    bucket  = "lho-cdn-terraform-state"
    key     = "vpc/cdn.tfstate"
    region  = "eu-west-2"
    encrypt = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
