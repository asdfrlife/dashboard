import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
      <p className="text-zinc-400 text-sm">Loading dashboard data...</p>
    </div>
  );
}
