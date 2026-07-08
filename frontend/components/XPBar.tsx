"use client";

export interface XPBarProps {
  totalXp: number;
  currentLevel: number;
}

function xpForLevel(n: number): number {
  return Math.floor((100 * n * (n + 1)) / 2);
}

export default function XPBar({ totalXp, currentLevel }: XPBarProps) {
  const xpForCurrent = xpForLevel(currentLevel);
  const xpForNext = xpForLevel(currentLevel + 1);
  const xpSpan = Math.max(xpForNext - xpForCurrent, 1);
  const xpInLevel = Math.max(totalXp - xpForCurrent, 0);
  const progress = Math.min(Math.max((xpInLevel / xpSpan) * 100, 0), 100);

  return (
    <div className="nes-container is-dark with-title">
      <p className="title">Experiencia</p>
      <div className="flex flex-col gap-2 py-2">
        <p className="nes-text is-primary">XP: {totalXp}</p>
        <progress
          className="nes-progress is-success"
          value={progress}
          max={100}
        />
        <p className="text-white text-xs">
          {xpInLevel} / {xpSpan} XP para nivel {currentLevel + 1}
        </p>
      </div>
    </div>
  );
}