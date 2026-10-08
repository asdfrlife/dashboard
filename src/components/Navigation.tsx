'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Video, AlertCircle, PlayCircle, Youtube, Instagram, Database, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/youtube', label: 'YouTube', icon: Youtube },
  { href: '/instagram', label: 'Instagram', icon: Instagram },
  { href: '/scraping', label: 'Scraping', icon: Database },
  { href: '/performance', label: 'Metrics', icon: BarChart2 },
  { href: '/videos', label: 'Videos', icon: Video },
  { href: '/errors', label: 'Errors', icon: AlertCircle },
  { href: '/runs', label: 'Runs', icon: PlayCircle },
];

export function Navigation() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-md md:relative md:border-t-0 md:border-b md:flex md:items-center md:px-6 md:h-16 overflow-x-auto">
      <div className="flex items-center h-16 md:h-auto md:justify-start space-x-4 md:space-x-8 px-4 w-max md:w-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors md:flex-row md:space-y-0 md:space-x-2 md:text-sm whitespace-nowrap",
                isActive ? "text-zinc-50" : "text-zinc-400 hover:text-zinc-300"
              )}
            >
              <Icon className="h-5 w-5 md:h-4 md:w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
