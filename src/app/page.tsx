'use client';

import { useState } from 'react';
import { MethodCard } from '@/components/MethodCard';
import { methods } from '@/lib/methods';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMethods = methods.filter((method) =>
    method.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    method.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 relative min-h-[calc(100vh-4rem)] flex flex-col justify-center">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      <section className="text-center my-8 md:my-16 animate-in-fade">
        <h1 className="text-4xl md:text-6xl font-bold font-headline leading-tight tracking-tight mb-6 animate-in-slide-up delay-200">
          Visualisasikan <br />
          <span className="text-gradient">Logika Pencarian</span> Anda
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed animate-in-slide-up delay-300">
          SimuSearch Studio membantu Anda memahami algoritma Information Retrieval melalui simulasi interaktif dan visualisasi data real-time.
        </p>
      </section>

      <section className="max-w-md mx-auto mb-12 animate-in-slide-up delay-300">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari metode simulasi..."
            className="pl-10 h-10 bg-background/50 backdrop-blur-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      <section id="metode" className="animate-in-slide-up delay-300 scroll-mt-24">
        <h2 className="text-2xl font-bold font-headline mb-8 text-center md:text-left flex items-center gap-2">
          <span className="w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-full mb-1" />
          Pilih Metode Simulasi
        </h2>
        {filteredMethods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {filteredMethods.map((method) => (
              <MethodCard key={method.id} method={method} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed rounded-lg bg-muted/20">
            <p className="text-muted-foreground">Tidak ada metode yang cocok dengan "{searchQuery}"</p>
          </div>
        )}
      </section>
    </div>
  );
}
