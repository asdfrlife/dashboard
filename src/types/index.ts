export type ProcessedVideo = {
  tweet_id: string;
  account_id: string | null;
  source_tweet_url: string | null;
  cdn_url: string | null;
  source_text: string | null;
  duration_seconds: number | null;
  r2_public_url: string | null;
  transcript: string | null;
  ai_metadata: Record<string, unknown> | null;
  processing_status: 'QUEUED' | 'DOWNLOADING' | 'RENDERING' | 'STAGED' | 'READY' | 'COMPLETED' | 'FAILED';
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type PlatformDelivery = {
  id: string;
  tweet_id: string | null;
  platform: 'youtube_shorts' | string;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';
  platform_post_id: string | null;
  platform_post_url: string | null;
  retry_count: number | null;
  last_error: string | null;
  published_at: string | null;
  created_at: string;
};

export type MonitoredAccount = {
  id: string;
  x_username: string;
  is_active: boolean | null;
};

export type RunLog = {
  id: number;
  created_at: string;
  run_id: string | null;
  level: 'INFO' | 'WARN' | 'ERROR';
  stage: string;
  tweet_id: string | null;
  message: string | null;
  duration_seconds: number | null;
};

export type GithubRun = {
  id: number;
  name: string;
  status: string | null;
  conclusion: string | null;
  html_url: string;
  run_started_at: string;
  created_at: string;
  updated_at: string;
};

export type PipelineSettings = {
  id: number;
  daily_cap: number;
  first_run_at: string;
};

