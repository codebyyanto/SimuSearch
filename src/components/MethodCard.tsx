import Link from 'next/link';
import Image from 'next/image';
import type { Method } from '@/lib/methods';
import { icons } from '@/lib/methods';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

type MethodCardProps = {
  method: Method;
};

export function MethodCard({ method }: MethodCardProps) {
  const placeholderImage = PlaceHolderImages.find(p => p.id === method.id);
  const Icon = icons[method.icon];

  return (
    <Link href={method.path} className="group block h-full">
      <Card className="h-full flex flex-col glass-card border-transparent hover:border-accent/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {placeholderImage && (
          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
            <Image
              src={placeholderImage.imageUrl}
              alt={placeholderImage.description}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              data-ai-hint={placeholderImage.imageHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-60" />
          </div>
        )}

        <CardHeader className="flex-grow relative z-10">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-xl flex-shrink-0 backdrop-blur-sm group-hover:bg-primary/20 transition-colors">
              <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div>
              <CardTitle className="font-headline text-lg group-hover:text-primary transition-colors">{method.title}</CardTitle>
              <CardDescription className="mt-2 text-sm leading-relaxed">{method.description}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 mt-auto">
          <div className="text-sm font-medium text-accent flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-all transform translate-x-0 group-hover:translate-x-1">
            <span>Mulai Simulasi</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
