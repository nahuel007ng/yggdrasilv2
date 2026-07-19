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
      <p className="flex items-center gap-2 text-lg text-mana">
        <span
          className="shrink-0"
          style={{
            filter:
              shields === 0
                ? "grayscale(1) opacity(0.45)"
                : "drop-shadow(0 0 6px rgba(45, 212, 191, 0.5))",
          }}
        >
          <PixelIcon name="shield" size={20} />
        </span>
        Shields: {shields}
      </p>
      <p className="text-muted text-xs mt-2">
        Los shields protegen tus rachas si faltas un dia
      </p>
    </div>
  );
}