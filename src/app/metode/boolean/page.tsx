import { SimulationPage } from '@/components/SimulationPage';
import { methods } from '@/lib/methods';

export default function BooleanPage() {
  const method = methods.find((m) => m.id === 'boolean');

  if (!method) {
    return <div>Method not found</div>;
  }

  return <SimulationPage method={method} />;
}
