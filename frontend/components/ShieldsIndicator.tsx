"use client";

import PixelIcon from "@/components/PixelIcon";

export interface ShieldsIndicatorProps {
  shields: number;
}

export default function ShieldsIndicator({ shields }: ShieldsIndicatorProps) {
  return (
    <div
      className="pixel-card"
      title="Los shields protegen tus rachas si faltas un dia"
    >
      <h3 className="pixel-card-title">Shields</h3>
      <p className={`flex items-center gap-2 text-lg ${shields > 0 ? "text-xp" : "text-muted"}`}>
        <PixelIcon name="shield" size={20} className="shrink-0" />
        {shields > 0 ? `Shields: ${shields}` : "Sin shields"}
      </p>
      <p className="text-muted text-xs mt-2">
        Los shields protegen tus rachas si faltas un dia
      </p>
    </div>
  );
}