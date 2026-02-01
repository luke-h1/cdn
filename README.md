# CDN

A self-hosted CDN and link shortener powered by Cloudflare Workers, R2, and D1, with a Next.js admin dashboard to manage objects.

## Why?

After being inspired by code with beto's post about what he built with claude (https://x.com/betomoedano/status/2017225369804259731), I realised I could do with improving my CDN project. with the ability to generate short links for sharing private files (for things such as internal TestFlight/TestTrack feedback) along with moving to cloudflare for better costs. Cloudflare R2 offers generous free tier limits and S3-compatible APIs, while D1 provides a lightweight database for the link shortener functionality with a generous free tier.

**Key features:**

- **Private R2 bucket** - Files are only accessible through the Worker or via generated short links
- **Edge deployment** - Next.js app runs on Cloudflare Workers for low latency globally
- **Direct bindings** - Uses R2 and D1 bindings

## Table of contents

- [CDN](#cdn)
  - [Why?](#why)
  - [Table of contents](#table-of-contents)
  - [Features](#features)
  - [Architecture](#architecture)
  - [Prerequisites](#prerequisites)
  - [Getting started](#getting-started)
    - [1. Clone and install](#1-clone-and-install)
    - [2. Set up Cloudflare resources](#2-set-up-cloudflare-resources)
    - [3. Configure environment variables](#3-configure-environment-variables)
    - [4. Initialize the D1 database](#4-initialize-the-d1-database)
    - [5. Run the admin dashboard](#5-run-the-admin-dashboard)
  - [Deploying your own version](#deploying-your-own-version)
    - [Infrastructure deployment](#infrastructure-deployment)
    - [Admin dashboard deployment](#admin-dashboard-deployment)
  - [Environment variables](#environment-variables)
  - [Terraform variables](#terraform-variables)
  - [Project structure](#project-structure)
  - [Contributing](#contributing)
  - [Bug reports](#bug-reports)

## Features

- **Private R2 storage** - S3-compatible object storage, accessible only through the Worker
- **Link shortener** - Create short URLs that serve files directly
- **Admin dashboard** - Next.js app for managing files and links, deployed to Cloudflare Workers
- **Edge caching** - Cloudflare cache rules for images, static assets, and documents
- **CORS headers** - Pre-configured for cross-origin requests
- **Infrastructure as code** - Terraform configuration for reproducible deployments
- **Zero cold starts** - Uses OpenNext adapter optimized for Cloudflare Workers

## Architecture

| Component      | Technology         | Purpose                                  |
| -------------- | ------------------ | ---------------------------------------- |
| Compute        | Cloudflare Workers | Edge-deployed Next.js app                |
| Object storage | Cloudflare R2      | Private static file hosting              |
| Database       | Cloudflare D1      | Link shortener data                      |
| CDN            | Cloudflare         | Edge caching, DNS, and custom domain     |
| Admin UI       | Next.js + OpenNext | File and link management                 |
| Infrastructure | Terraform          | Resource provisioning (R2, D1, API keys) |

## Prerequisites

- [Node.js](https://nodejs.org/en/) (v20+)
- [Bun](https://bun.sh/) (v1.3.5+)
- [Terraform](https://www.terraform.io/) (v1.5.0+)
- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- A domain managed by Cloudflare

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/luke-h1/cdn.git
cd cdn
bun install
```

### 2. Set up Cloudflare resources

You'll need the following from your Cloudflare dashboard:

1. **Account ID** - Found in the URL when viewing your account: `dash.cloudflare.com/<account-id>`
2. **Zone ID** - Found in the Overview tab of your domain
3. **API Token** - Create one with the following permissions `https://dash.cloudflare.com/profile/api-tokens`:
   - Account > D1 > Edit
   - Account > Workers R2 Storage > Edit
   - Zone > DNS > Edit
   - Zone > Cache Rules > Edit
   - Zone > Transform Rules > Edit

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

### 4. Initialize the D1 database

After deploying the infrastructure, initialize the database schema:

```bash
wrangler d1 execute <your-db-name> --command "CREATE TABLE IF NOT EXISTS links (shortCode TEXT PRIMARY KEY, longUrl TEXT NOT NULL, createdAt TEXT NOT NULL); CREATE INDEX IF NOT EXISTS idx_links_createdAt ON links(createdAt);"
```

### 5. Run the admin dashboard

```bash
bun run dev
```

The dashboard will be available at `http://localhost:3000`.

## Deploying your own version

### Infrastructure deployment

> [!IMPORTANT]
> You'll need an S3 bucket (or compatible storage) to store Terraform state. Update the backend configuration in `versions.tf` before deploying.

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

   variable "domain" {
     default = "cdn.yourdomain.com"
   }

   variable "d1_database_name" {
     default = "your-cdn-links"
   }
   ```

3. **Create a `terraform.tfvars` file**

   ```hcl
   cloudflare_account_id = "your-account-id"
   cloudflare_zone_id    = "your-zone-id"
   cloudflare_api_token  = "your-api-token"
   ```

   > [!WARNING]
   > Never commit `terraform.tfvars` to version control. It's already in `.gitignore`.

4. **Initialize and deploy**

   ```bash
   terraform init
   terraform plan -var-file terraform.tfvars
   terraform apply -var-file terraform.tfvars
   ```

5. **Capture the outputs**

   After applying, Terraform will output the credentials you need for the admin dashboard:

   ```bash
   terraform output -json
   ```

   Copy the relevant values to your `.env` file.

### Admin dashboard deployment (Cloudflare Workers)

The admin dashboard is deployed to Cloudflare Workers using the OpenNext adapter. This gives you:

- Global edge deployment with low latency
- Direct R2 and D1 bindings (no API tokens needed in production)
- Private bucket access - files are only served through the Worker

1. **Update `wrangler.toml`**

   Edit `wrangler.toml` and update the D1 database ID from the Terraform output:

   ```toml
   [[d1_databases]]
   binding = "D1_DATABASE"
   database_name = "your-cdn-links"
   database_id = "your-database-id-from-terraform"
   ```

   Also update the bucket name and custom domain if needed:

   ```toml
   [[r2_buckets]]
   binding = "R2_BUCKET"
   bucket_name = "your-cdn-bucket"

   [env.production]
   routes = [
     { pattern = "cdn.yourdomain.com", custom_domain = true }
   ]
   ```

2. **Preview locally with Workers runtime**

   Test your app in the Cloudflare Workers runtime:

   ```bash
   bun run preview
   ```

3. **Deploy to Cloudflare Workers**

   ```bash
   bun run deploy
   ```

   This will:
   - Build your Next.js app with OpenNext
   - Deploy to Cloudflare Workers
   - Set up the custom domain route

4. **Set runtime environment variables**

   In the Cloudflare dashboard, set any required environment variables for your Worker:
   - Go to Workers & Pages > your-worker > Settings > Variables
   - Add `NEXT_PUBLIC_CDN_URL` = `https://cdn.yourdomain.com`

> [!NOTE]
> The R2 bucket is private by design. Files can only be accessed:
>
> - Through the admin dashboard (`/cdn/*` routes)
> - Via short links (`/s/*` routes)
> - Through the API routes (for authorized management)

## Environment variables

### Local development (`.env`)

These are only needed for local development. In production, the Worker uses bindings directly.

| Variable                | Description                            | Required |
| ----------------------- | -------------------------------------- | -------- |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID             | Yes      |
| `R2_BUCKET_NAME`        | Name of the R2 bucket                  | Yes      |
| `R2_API_TOKEN`          | R2 API token (from Terraform output)   | Yes      |
| `D1_DATABASE_ID`        | D1 database ID (from Terraform output) | Yes      |
| `D1_API_TOKEN`          | D1 API token (from Terraform output)   | Yes      |
| `NEXT_PUBLIC_CDN_URL`   | Public URL of your CDN                 | Yes      |

### Production (Cloudflare Dashboard)

| Variable              | Description            | Set In           |
| --------------------- | ---------------------- | ---------------- |
| `NEXT_PUBLIC_CDN_URL` | Public URL of your CDN | Worker Variables |

> [!NOTE]
> In production, R2 and D1 access is handled through bindings configured in `wrangler.toml`. No API tokens are needed at runtime.

## Terraform variables

| Variable                | Description             | Default           |
| ----------------------- | ----------------------- | ----------------- |
| `bucket_name`           | Name of the R2 bucket   | `lho-cdn`         |
| `domain`                | Domain name for the CDN | `cdn.lhowsam.com` |
| `cloudflare_zone_id`    | Cloudflare Zone ID      | -                 |
| `cloudflare_account_id` | Cloudflare Account ID   | -                 |
| `cloudflare_api_token`  | Cloudflare API token    | -                 |
| `r2_location`           | R2 bucket location hint | `WEUR` (west EU)  |
| `d1_database_name`      | D1 database name        | `lho-cdn-links`   |

## Project structure

```
cdn/
├── app/                    # Next.js app router
│   ├── api/               # API routes for R2 and D1
│   │   ├── links/         # Link shortener endpoints
│   │   └── objects/       # R2 object management
│   ├── cdn/               # CDN file serving (private R2 access)
│   │   └── [[...path]]/   # Catch-all route for file serving
│   └── s/                 # Short link handlers (proxy files or redirect)
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
│   ├── d1.ts             # D1 database client (bindings + REST fallback)
│   ├── r2.ts             # R2 storage client (bindings + REST fallback)
│   └── utils.ts          # Shared utilities
├── .github/
│   ├── actions/          # Reusable GitHub Actions
│   └── workflows/        # CI/CD workflows
├── wrangler.toml         # Cloudflare Workers configuration
├── open-next.config.ts   # OpenNext adapter configuration
├── cloudflare-env.d.ts   # TypeScript types for Cloudflare bindings
├── main.tf               # Terraform infrastructure
├── variables.tf          # Terraform variables
├── outputs.tf            # Terraform outputs
└── versions.tf           # Terraform providers
```

### Key routes

| Route            | Purpose                                         |
| ---------------- | ----------------------------------------------- |
| `/`              | Admin dashboard for managing files and links    |
| `/cdn/*`         | Serves files from private R2 bucket             |
| `/s/:shortCode`  | Short link handler (proxies files or redirects) |
| `/api/objects/*` | REST API for R2 object management               |
| `/api/links/*`   | REST API for link shortener                     |

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
