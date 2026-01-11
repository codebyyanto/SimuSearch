import Link from 'next/link';
import { SearchCode } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 hidden w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/80 md:block transition-all duration-300">
      <div className="container mx-auto flex h-16 items-center px-8">
        <div className="flex w-full justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-colors">
              <SearchCode className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold font-headline text-lg tracking-tight text-white">SimuSearch</span>
          </Link>
          <nav className="flex items-center space-x-8 text-sm font-medium">
            <Link
              href="/metode"
              className="relative py-1 text-white/70 transition-colors hover:text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full"
            >
              Metode
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
