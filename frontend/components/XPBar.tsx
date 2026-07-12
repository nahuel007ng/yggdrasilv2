"use client";

export interface XPBarProps {
  totalXp: number;
  currentLevel: number;
}

function xpForLevel(n: number): number {
  return Math.floor((10 * n * (n + 1)) / 2);
}

export default function XPBar({ totalXp, currentLevel }: XPBarProps) {
  const xpForCurrent = xpForLevel(currentLevel);
  const xpForNext = xpForLevel(currentLevel + 1);
  const xpSpan = Math.max(xpForNext - xpForCurrent, 1);
  const xpInLevel = Math.max(totalXp - xpForCurrent, 0);
  const progress = Math.min(Math.max((xpInLevel / xpSpan) * 100, 0), 100);

  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title">Experiencia</h3>
      <div className="flex flex-col gap-3 py-2">
        <p className="text-mana font-semibold">XP: {totalXp}</p>
        <div className="pixel-progress">
          <div
            className="pixel-progress-fill is-xp"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-muted text-xs">
          {xpInLevel} / {xpSpan} XP para nivel {currentLevel + 1}
        </p>
      </div>
    </div>
  );
}
