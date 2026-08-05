import {
  AirVent,
  Bath,
  Bell,
  Car,
  Coffee,
  Croissant,
  LampDesk,
  Lock,
  Moon,
  Shirt,
  ShowerHead,
  Sparkles,
  Trees,
  Tv,
  Waves,
  Wifi,
  Wind,
  Wine,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  "air-vent": AirVent,
  wifi: Wifi,
  tv: Tv,
  "shower-head": ShowerHead,
  bath: Bath,
  shirt: Shirt,
  wind: Wind,
  lock: Lock,
  wine: Wine,
  coffee: Coffee,
  "lamp-desk": LampDesk,
  waves: Waves,
  trees: Trees,
  moon: Moon,
  sparkles: Sparkles,
  croissant: Croissant,
  car: Car,
  bell: Bell,
};

type AmenityIconProps = {
  name: string;
  className?: string;
};

export function AmenityIcon({ name, className }: AmenityIconProps) {
  const Icon = ICON_MAP[name] ?? Sparkles;
  return <Icon className={cn("h-4 w-4 shrink-0", className)} aria-hidden />;
}
