"use client";

export interface ShieldsIndicatorProps {
  shields: number;
}

export default function ShieldsIndicator({ shields }: ShieldsIndicatorProps) {
  return (
    <div className="nes-container is-dark with-title" title="Los shields protegen tus rachas si faltas un dia">
      <p className="title">Shields</p>
      <p className={shields > 0 ? "nes-text is-success" : "text-gray-400"}>
        🛡️ {shields > 0 ? `Shields: ${shields}` : "Sin shields"}
      </p>
      <p className="text-white text-[10px] mt-1">
        Los shields protegen tus rachas si faltas un dia
      </p>
    </div>
  );
}