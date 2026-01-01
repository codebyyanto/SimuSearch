import { SimulationPage } from '@/components/SimulationPage';
import { methods } from '@/lib/methods';

export default function ClusteringPage() {
  const method = methods.find((m) => m.id === 'clustering');

  if (!method) {
    return <div>Method not found</div>;
  }

  return <SimulationPage method={method} />;
}
