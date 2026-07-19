"use client";

import { computeStats, STAT_KEYS, STAT_INFO, STAT_MAX } from "@/lib/stats";

interface StatsPanelProps {
  currentLevel: number;
  badgeCodes: string[];
  titleCodes: string[];
}

export default function StatsPanel({ currentLevel, badgeCodes, titleCodes }: StatsPanelProps) {
  const stats = computeStats(currentLevel, badgeCodes, titleCodes);

  return (
    <div className="pixel-card">
      <h2 className="pixel-card-title">Estadísticas</h2>
      <div className="space-y-2">
        {STAT_KEYS.map((k) => {
          const widthPct = Math.max((stats[k] / STAT_MAX) * 100, 2);
          return (
            <div key={k} className="flex items-center gap-2">
              <span className="text-pixel text-xs w-24 shrink-0">
                {STAT_INFO[k].icon} {k}
              </span>
              <div className="pixel-progress flex-1">
                <div
                  className="pixel-progress-fill is-mana"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className="font-mono text-mana text-sm ml-auto shrink-0">
                {stats[k]}
                <span className="text-muted text-[10px]">/{STAT_MAX}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}