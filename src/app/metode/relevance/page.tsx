import { SimulationPage } from '@/components/SimulationPage';
import { methods } from '@/lib/methods';

export default function RelevancePage() {
  const method = methods.find((m) => m.id === 'relevance');

  if (!method) {
    return <div>Method not found</div>;
  }

  return <SimulationPage method={method} />;
}
