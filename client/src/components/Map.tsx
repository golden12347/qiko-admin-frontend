import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface Coordinates {
  lat: number;
  lng: number;
}

interface MapViewProps {
  className?: string;
  initialCenter?: Coordinates;
  initialZoom?: number;
  onMapReady?: (map: null) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
}: MapViewProps) {
  useEffect(() => {
    onMapReady?.(null);
  }, [onMapReady]);

  return (
    <div
      className={cn(
        "w-full h-[500px] rounded-lg border border-border/40 bg-secondary/30 flex items-center justify-center",
        className
      )}
    >
      <div className="text-center px-6">
        <p className="text-sm font-medium">Map preview disabled</p>
        <p className="text-xs text-muted-foreground mt-1">
          API-driven map integrations have been removed.
        </p>
        <p className="text-xs text-muted-foreground/80 mt-2 tabular-nums">
          Center: {initialCenter.lat.toFixed(4)}, {initialCenter.lng.toFixed(4)} · Zoom: {initialZoom}
        </p>
      </div>
    </div>
  );
}
