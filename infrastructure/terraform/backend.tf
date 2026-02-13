# LifeThon Infrastructure - Backend Configuration
# This file configures remote state storage in S3

# IMPORTANT: Create these resources manually BEFORE running terraform init:
# 1. S3 bucket for state storage
# 2. DynamoDB table for state locking

# To create the backend resources, run:
# aws s3api create-bucket \
#   --bucket lifethon-terraform-state-YOUR-AWS-ACCOUNT-ID \
#   --region ap-southeast-2 \
#   --create-bucket-configuration LocationConstraint=ap-southeast-2
#
# aws s3api put-bucket-versioning \
#   --bucket lifethon-terraform-state-YOUR-AWS-ACCOUNT-ID \
#   --versioning-configuration Status=Enabled
#
# aws s3api put-bucket-encryption \
#   --bucket lifethon-terraform-state-YOUR-AWS-ACCOUNT-ID \
#   --server-side-encryption-configuration '{
#     "Rules": [{
#       "ApplyServerSideEncryptionByDefault": {
#         "SSEAlgorithm": "AES256"
#       }
#     }]
#   }'
#
# aws dynamodb create-table \
#   --table-name lifethon-terraform-locks \
#   --attribute-definitions AttributeName=LockID,AttributeType=S \
#   --key-schema AttributeName=LockID,KeyType=HASH \
#   --billing-mode PAY_PER_REQUEST \
#   --region ap-southeast-2

# After creating the resources above, uncomment this block in main.tf:
#
# terraform {
#   backend "s3" {
#     bucket         = "lifethon-terraform-state-YOUR-AWS-ACCOUNT-ID"
#     key            = "prod/terraform.tfstate"
#     region         = "ap-southeast-2"
#     encrypt        = true
#     dynamodb_table = "lifethon-terraform-locks"
#   }
# }

# For multiple environments, use different state file keys:
# dev:     key = "dev/terraform.tfstate"
# staging: key = "staging/terraform.tfstate"
# prod:    key = "prod/terraform.tfstate"

# Alternative: Use Terraform Cloud for remote state (recommended for teams)
# Sign up at https://app.terraform.io and configure:
#
# terraform {
#   cloud {
#     organization = "your-org-name"
#     workspaces {
#       name = "lifethon-prod"
#     }
#   }
# }
