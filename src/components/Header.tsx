import Link from 'next/link';
import { SearchCode } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 hidden w-full border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 md:block transition-all duration-300">
      <div className="container flex h-16 items-center">
        <div className="mr-8 flex w-full justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
              <SearchCode className="h-6 w-6 text-primary" />
            </div>
            <span className="font-bold font-headline text-lg tracking-tight">SimuSearch</span>
          </Link>
          <nav className="flex items-center space-x-8 text-sm font-medium">
            <Link
              href="/metode"
              className="relative py-1 text-foreground/70 transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              Metode
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
