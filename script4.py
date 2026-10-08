import os

base_dir = r"c:\Users\Dell\Documents\New\dashboard"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')

loading_content = """
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
      <p className="text-zinc-400 text-sm">Loading dashboard data...</p>
    </div>
  );
}
"""

error_content = """
'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="text-zinc-400 text-sm max-w-md text-center">
        {error.message || 'An unexpected error occurred while loading this page.'}
      </p>
      <button
        onClick={() => reset()}
        className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-md transition-colors flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" /> Try again
      </button>
    </div>
  );
}
"""

dirs = [
  r"src\app\youtube",
  r"src\app\instagram",
  r"src\app\scraping",
  r"src\app\performance"
]

for d in dirs:
    write_file(os.path.join(d, "loading.tsx"), loading_content)
    write_file(os.path.join(d, "error.tsx"), error_content)

print("Done creating loading and error states.")
