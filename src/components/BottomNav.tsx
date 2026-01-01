'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/metode', label: 'Metode', icon: LayoutGrid },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 md:hidden pb-safe">
      <div className="grid h-16 grid-cols-2 max-w-lg mx-auto font-medium">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'inline-flex flex-col items-center justify-center px-5 transition-colors relative',
              (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {(pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) && (
              <span className="absolute top-0 w-12 h-1 bg-primary rounded-b-full shadow-[0_2px_10px] shadow-primary/50" />
            )}
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-[10px] uppercase tracking-wider font-semibold">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
