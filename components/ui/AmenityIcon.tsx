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

/** Duotone amenity mark: blue stroke over soft sky fill. */
export function AmenityIcon({ name, className }: AmenityIconProps) {
  const Icon = ICON_MAP[name] ?? Sparkles;
  return (
    <span
      className={cn(
        "relative inline-grid h-8 w-8 shrink-0 place-items-center text-blue",
        className
      )}
      aria-hidden
    >
      <span className="absolute inset-1 rounded-md bg-sky" />
      <Icon className="relative h-4 w-4" strokeWidth={1.75} />
    </span>
  );
}
