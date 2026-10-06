import { GithubRun } from '@/types';

export async function getGithubRuns(): Promise<GithubRun[]> {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  if (!owner || !repo || !token) {
    return [];
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/run_bot.yml/runs?per_page=30`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error(`GitHub API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data.workflow_runs || [];
  } catch (error) {
    console.error('Failed to fetch GitHub runs:', error);
    return [];
  }
}
