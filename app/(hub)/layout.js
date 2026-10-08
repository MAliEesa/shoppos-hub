import { SHOPS } from '@/lib/shops.config';
import HubShell from '@/components/hub/HubShell';

export default function HubLayout({ children }) {
  const shops = SHOPS.map((s) => ({ id: s.id, name: s.name, accentColor: s.accentColor }));
  return <HubShell shops={shops}>{children}</HubShell>;
}