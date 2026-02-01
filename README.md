# CDN

A self-hosted CDN and link shortener powered by AWS S3 and DynamoDB, with a Next.js admin dashboard deployed to Vercel.

## Why?

After being inspired by code with beto's post about what he built with claude (https://x.com/betomoedano/status/2017225369804259731), I realised I could do with improving my CDN project. The ability to generate short links for sharing private files (for things such as internal TestFlight/TestTrack feedback) was a key feature I wanted. AWS S3 provides reliable object storage with great SDK support, while DynamoDB offers a serverless database for the link shortener functionality.

**Key features:**

- **Private S3 bucket** - Files are only accessible through the Vercel app or via generated short links
- **Serverless deployment** - Next.js app runs on Vercel for low latency globally
- **Infrastructure as code** - Terraform manages all AWS resources

## Table of contents

- [CDN](#cdn)
  - [Why?](#why)
  - [Table of contents](#table-of-contents)
  - [Features](#features)
  - [Architecture](#architecture)
  - [Prerequisites](#prerequisites)
  - [Getting started](#getting-started)
    - [1. Clone and install](#1-clone-and-install)
    - [2. Set up AWS resources](#2-set-up-aws-resources)
    - [3. Configure environment variables](#3-configure-environment-variables)
    - [4. Run the admin dashboard](#4-run-the-admin-dashboard)
  - [Deploying your own version](#deploying-your-own-version)
    - [Infrastructure deployment](#infrastructure-deployment)
    - [Admin dashboard deployment](#admin-dashboard-deployment)
  - [Environment variables](#environment-variables)
  - [Terraform variables](#terraform-variables)
  - [Project structure](#project-structure)
  - [Contributing](#contributing)
  - [Bug reports](#bug-reports)

## Features

- **Private S3 storage** - Object storage accessible only through the Next.js app
- **Link shortener** - Create short URLs that serve files directly
- **Admin dashboard** - Next.js app for managing files and links, deployed to Vercel
- **Multiple public endpoints** - `/cdn/*`, `/public/*`, and `/s/*` routes for serving files
- **CORS headers** - Pre-configured for cross-origin requests
- **Infrastructure as code** - Terraform configuration for reproducible deployments

## Architecture

| Component      | Technology | Purpose                              |
| -------------- | ---------- | ------------------------------------ |
| Compute        | Vercel     | Serverless Next.js deployment        |
| Object storage | AWS S3     | Private static file hosting          |
| Database       | DynamoDB   | Link shortener data                  |
| Admin UI       | Next.js    | File and link management             |
| Infrastructure | Terraform  | Resource provisioning (S3, DynamoDB) |

## Prerequisites

- [Node.js](https://nodejs.org/en/) (v20+)
- [Bun](https://bun.sh/) (v1.3.5+)
- [Terraform](https://www.terraform.io/) (v1.5.0+)
- [AWS account](https://aws.amazon.com/)
- [Vercel account](https://vercel.com/)

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/luke-h1/cdn.git
cd cdn
bun install
```

### 2. Set up AWS resources

You'll need the following from your AWS account:

1. **AWS Access Key ID** - From IAM user credentials
2. **AWS Secret Access Key** - From IAM user credentials
3. **IAM permissions** - The user needs permissions for:
   - S3: `s3:*` on your bucket
   - DynamoDB: `dynamodb:*` on your table

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

### 4. Run the admin dashboard

```bash
bun run dev
```

The dashboard will be available at `http://localhost:3000`.

## Deploying your own version

### Infrastructure deployment

> [!IMPORTANT]
> You'll need an S3 bucket to store Terraform state. Update the backend configuration in `versions.tf` before deploying.

1. **Update Terraform backend**

   Edit `versions.tf` and change the backend configuration to your own S3 bucket:

   ```hcl
   backend "s3" {
     bucket  = "your-terraform-state-bucket"
     key     = "cdn/terraform.tfstate"
     region  = "your-region"
     encrypt = true
   }
   ```

   Alternatively, use local state for testing:

   ```hcl
   backend "local" {
     path = "terraform.tfstate"
   }
   ```

2. **Update default values**

   Edit `variables.tf` and update the defaults for your deployment:

   ```hcl
   variable "bucket_name" {
     default = "your-cdn-bucket"
   }

   variable "dynamodb_table_name" {
     default = "your-cdn-links"
   }
   ```

3. **Initialize and deploy**

   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

### Admin dashboard deployment (Vercel)

The admin dashboard is deployed to Vercel. This gives you:

- Global edge deployment with low latency
- Automatic HTTPS and custom domains
- Private bucket access - files are only served through the app

1. **Connect to Vercel**

   Link your repository to Vercel and configure the environment variables in the Vercel dashboard.

2. **Set environment variables**

   In the Vercel dashboard, set the required environment variables:

   - `AWS_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `S3_BUCKET_NAME`
   - `DYNAMODB_TABLE_NAME`
   - `NEXT_PUBLIC_CDN_URL`
   - `NEXT_PUBLIC_ADMIN_URL`

3. **Deploy**

   Push to your main branch or trigger a deployment from the Vercel dashboard.

> [!NOTE]
> The S3 bucket is private by design. Files can only be accessed:
>
> - Through the admin dashboard (`/cdn/*` or `/public/*` routes)
> - Via short links (`/s/*` routes)
> - Through the API routes (for authorized management)

## Environment variables

| Variable                 | Description                            | Required |
| ------------------------ | -------------------------------------- | -------- |
| `AWS_REGION`             | AWS region (e.g., `eu-west-2`)         | Yes      |
| `AWS_ACCESS_KEY_ID`      | AWS access key ID                      | Yes      |
| `AWS_SECRET_ACCESS_KEY`  | AWS secret access key                  | Yes      |
| `S3_BUCKET_NAME`         | Name of the S3 bucket                  | Yes      |
| `DYNAMODB_TABLE_NAME`    | Name of the DynamoDB table             | Yes      |
| `NEXT_PUBLIC_CDN_URL`    | Public URL for CDN assets              | Yes      |
| `NEXT_PUBLIC_ADMIN_URL`  | Public URL for admin site              | Yes      |
| `BASIC_AUTH_USER`        | Basic auth username (optional)         | No       |
| `BASIC_AUTH_PASSWORD`    | Basic auth password (optional)         | No       |

## Terraform variables

| Variable              | Description              | Default         |
| --------------------- | ------------------------ | --------------- |
| `aws_region`          | AWS region               | `eu-west-2`     |
| `bucket_name`         | Name of the S3 bucket    | `lho-cdn`       |
| `dynamodb_table_name` | Name of DynamoDB table   | `lho-cdn-links` |

## Project structure

```
cdn/
├── app/                    # Next.js app router
│   ├── api/               # API routes for S3 and DynamoDB
│   │   ├── links/         # Link shortener endpoints
│   │   └── objects/       # S3 object management
│   ├── cdn/               # CDN file serving (private S3 access)
│   │   └── [[...path]]/   # Catch-all route for file serving
│   ├── public/            # Public file serving endpoint
│   │   └── [[...path]]/   # Catch-all route for file serving
│   └── s/                 # Short link handlers
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
│   ├── dynamodb.ts       # DynamoDB client
│   ├── s3.ts             # S3 storage client
│   └── utils.ts          # Shared utilities
├── .github/
│   ├── actions/          # Reusable GitHub Actions
│   └── workflows/        # CI/CD workflows
├── main.tf               # Terraform infrastructure
├── variables.tf          # Terraform variables
├── outputs.tf            # Terraform outputs
└── versions.tf           # Terraform providers
```

### Key routes

| Route            | Auth     | Purpose                                         |
| ---------------- | -------- | ----------------------------------------------- |
| `/`              | Required | Admin dashboard for managing files and links    |
| `/cdn/*`         | Required | Serves files from S3 (private access)           |
| `/public/*`      | Public   | Serves files from S3 (shareable)                |
| `/s/:shortCode`  | Public   | Short link handler (serves files or redirects)  |
| `/api/objects/*` | Required | REST API for S3 object management               |
| `/api/links/*`   | Required | REST API for link shortener                     |

## Contributing

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Open a PR against `main`

## Bug reports

If you encounter a problem with this project, please open an issue. Be sure to include:

- Node/Bun version
- Terraform version
- OS
- Brief but thorough reproduction steps
