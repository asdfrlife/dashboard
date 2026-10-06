# Autonomous Social Clipper Dashboard

A Next.js 15 professional monitoring dashboard for tracking the health and operations of the automated video-clipping pipeline.

## Features
- **Overview**: High-level system health, KPI cards, activity feed, and account summaries.
- **Videos**: Searchable table of processed videos with deep dive drawer.
- **Errors**: Aggregated and auto-categorized errors from all pipeline stages.
- **Runs**: History of GitHub Actions pipeline executions.

## Local Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env.local` and fill in the values:
   ```bash
   cp .env.example .env.local
   ```
   
   Values you need:
   - `SUPABASE_URL`: Your Supabase project URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (must be kept secret).
   - `GITHUB_TOKEN`: A fine-grained GitHub PAT (see below).
   - `GITHUB_OWNER`: GitHub username or organization (e.g., `octocat`).
   - `GITHUB_REPO`: The repository name where the pipeline runs (e.g., `auto-clipper`).
   - `DASHBOARD_PASSWORD`: A simple password to access the dashboard.
   - `SESSION_SECRET`: A random 32+ character string.

3. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` and login with your `DASHBOARD_PASSWORD`.

## How to create the GitHub Token

1. Go to GitHub -> Settings -> Developer settings -> Personal access tokens -> Fine-grained tokens.
2. Click **Generate new token**.
3. Name it "Dashboard Actions Viewer".
4. Set the expiration (e.g., 90 days).
5. **Repository access**: Select "Only select repositories" and choose your pipeline repository.
6. **Permissions**: Go to "Repository permissions", find "Actions", and set it to **Access: Read-only**.
7. Generate and copy the token into your `.env.local` as `GITHUB_TOKEN`.

## Step-by-Step Vercel Deployment

1. Push this repository to GitHub.
2. Log into [Vercel](https://vercel.com) and click **Add New... > Project**.
3. Import your GitHub repository.
4. Open the **Environment Variables** section and add ALL the variables from your `.env.local`.
   - Ensure you use the `SUPABASE_SERVICE_ROLE_KEY` and the `GITHUB_TOKEN`.
   - Set a strong `DASHBOARD_PASSWORD`.
5. Click **Deploy**.
6. Once deployed, Vercel will provide a live URL (e.g., `https://your-dashboard.vercel.app`).
7. Open the URL, enter the `DASHBOARD_PASSWORD`, and view your pipeline health!
