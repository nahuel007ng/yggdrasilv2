"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const DOW_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

interface StudyCalendarProps {
  month: number;
  year: number;
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getDowIndex(date: Date): number {
  const jsDow = date.getDay();
  return jsDow === 0 ? 6 : jsDow - 1;
}

export default function StudyCalendar({ month, year }: StudyCalendarProps) {
  const [dayHours, setDayHours] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = getLastDayOfMonth(year, month);
  const endOfMonth = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("study_sessions")
      .select("start_time, duration_minutes")
      .gte("start_time", `${startOfMonth}T00:00:00`)
      .lte("start_time", `${endOfMonth}T23:59:59`)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error.message);
          return;
        }

        const map: Record<string, number> = {};
        for (const s of data ?? []) {
          if (s.start_time && s.duration_minutes != null) {
            const dateStr = s.start_time.slice(0, 10);
            map[dateStr] = (map[dateStr] ?? 0) + Number(s.duration_minutes) / 60;
          }
        }
        setDayHours(map);
      });

    return () => {
      cancelled = true;
    };
  }, [startOfMonth, endOfMonth]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const firstDay = new Date(year, month - 1, 1);
  const startOffset = getDowIndex(firstDay);
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(d);

  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title">Calendario de estudio</h3>

      {error && <p className="text-hp">Error: {error}</p>}
      {!error && dayHours === null && <p className="text-muted">Cargando...</p>}

      {!error && dayHours !== null && (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-1 min-w-[280px]">
            {DOW_LABELS.map((d) => (
              <div key={d} className="text-center text-xs text-muted py-1">
                {d}
              </div>
            ))}
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} />;
              }
              const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isFuture = dateStr > todayStr;
              const isToday = dateStr === todayStr;
              const hours = dayHours[dateStr];
              const hasStudy = hours !== undefined && hours > 0;

              let cellClass =
                "flex flex-col items-center justify-center py-2 text-xs ";
              if (hasStudy) {
                cellClass += "bg-[--color-xp]/20 text-xp";
              } else if (isFuture) {
                cellClass += "bg-[--color-bg-surface] text-muted";
              } else {
                cellClass += "bg-[--color-bg-surface] text-muted";
              }
              if (isToday) cellClass += " ring-2 ring-[--color-gold]";

              return (
                <div key={dateStr} className={cellClass}>
                  <span>{day}</span>
                  {hasStudy && (
                    <span className="text-[9px]">{hours.toFixed(1)}h</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
