import { getGithubRuns } from '@/lib/github';
import { RunsTable } from '@/components/RunsTable';

export const dynamic = 'force-dynamic';

export default async function RunsPage() {
  const runs = await getGithubRuns();

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline Runs</h1>
        <p className="text-sm text-zinc-400">GitHub Actions execution history.</p>
      </div>

      <RunsTable initialData={runs} />
    </div>
  );
}
