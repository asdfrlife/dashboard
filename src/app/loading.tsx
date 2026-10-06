import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      <p className="text-sm text-zinc-500 font-medium animate-pulse">Loading dashboard data...</p>
    </div>
  );
}
