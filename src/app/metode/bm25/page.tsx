import { SimulationPage } from '@/components/SimulationPage';
import { methods } from '@/lib/methods';

export default function Bm25Page() {
  const method = methods.find((m) => m.id === 'bm25');

  if (!method) {
    return <div>Method not found</div>;
  }

  return <SimulationPage method={method} />;
}
