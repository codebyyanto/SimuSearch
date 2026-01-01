import { SimulationPage } from '@/components/SimulationPage';
import { methods } from '@/lib/methods';

export default function RegexPage() {
  const method = methods.find((m) => m.id === 'regex');

  if (!method) {
    return <div>Method not found</div>;
  }

  return <SimulationPage method={method} />;
}
