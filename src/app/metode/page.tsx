import { MethodCard } from '@/components/MethodCard';
import { methods } from '@/lib/methods';

export default function MethodsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="my-8">
        <h1 className="text-3xl md:text-4xl font-bold font-headline text-center">
          Metode Information Retrieval
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto text-center">
          Pilih metode di bawah ini untuk melihat cara kerjanya dan menjalankan simulasi Anda sendiri.
        </p>
      </section>

      <section className="mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {methods.map((method) => (
            <MethodCard key={method.id} method={method} />
          ))}
        </div>
      </section>
    </div>
  );
}
