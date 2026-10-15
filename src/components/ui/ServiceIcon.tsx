import { Building2, Flame, HardHat, ShieldCheck, Truck, Wrench, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  handling: Truck,
  construction: HardHat,
  fabrication: Flame,
  safety: ShieldCheck,
  custom: Wrench,
  structural: Building2,
};

export const SERVICE_ICON_KEYS = Object.keys(ICONS);

export default function ServiceIcon({ name, className = "h-7 w-7" }: { name: string | null; className?: string }) {
  const Icon = (name && ICONS[name]) || Wrench;
  return <Icon className={className} aria-hidden />;
}
