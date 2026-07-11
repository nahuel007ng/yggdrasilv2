"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PixelIcon from "@/components/PixelIcon";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DOW_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

export interface HabitCalendarProps {
  habitId: string | null;
  month: number; // 1-12
  year: number;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}

interface RecordRow {
  date: string;
  habit_id: string;
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getDowIndex(date: Date): number {
  const jsDow = date.getDay();
  return jsDow === 0 ? 6 : jsDow - 1;
}

export default function HabitCalendar({
  habitId,
  month,
  year,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: HabitCalendarProps) {
  const [records, setRecords] = useState<Record<string, Set<string>> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = getLastDayOfMonth(year, month);
  const endOfMonth = `${year}-${String(month).padStart(2, "0")}-${String(
    lastDay
  ).padStart(2, "0")}`;

  useEffect(() => {
    let query = supabase
      .from("habit_records")
      .select("date, habit_id")
      .gte("date", startOfMonth)
      .lte("date", endOfMonth)
      .eq("completed", true);

    if (habitId) query = query.eq("habit_id", habitId);

    query.then(({ data, error }) => {
      if (error) setError(error.message);
      else {
        const map: Record<string, Set<string>> = {};
        for (const r of (data ?? []) as RecordRow[]) {
          if (!map[r.date]) map[r.date] = new Set();
          map[r.date].add(r.habit_id);
        }
        setRecords(map);
      }
    });
  }, [habitId, startOfMonth, endOfMonth]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const firstDay = new Date(year, month - 1, 1);
  const startOffset = getDowIndex(firstDay);
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(d);

  const monthTitle = `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title">Calendario — {monthTitle}</h3>
      <div className="flex flex-col gap-2 py-2">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            className="pixel-btn"
            onClick={onPrev}
            disabled={!canPrev}
          >
            ◀
          </button>
          <span className="text-mana text-pixel text-xs">{monthTitle}</span>
          <button
            type="button"
            className="pixel-btn"
            onClick={onNext}
            disabled={!canNext}
          >
            ▶
          </button>
        </div>

        {error && <p className="text-hp">Error: {error}</p>}
        {!error && records === null && (
          <p className="text-muted">Cargando...</p>
        )}

        {!error && records !== null && (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-1 min-w-[280px]">
              {DOW_LABELS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs text-muted py-1"
                >
                  {d}
                </div>
              ))}
              {cells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} />;
                }
                const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
                  day
                ).padStart(2, "0")}`;
                const isFuture = dateStr > todayStr;
                const isToday = dateStr === todayStr;
                const dayRecords = records[dateStr];
                const completed = dayRecords && dayRecords.size > 0;

                let cellClass =
                  "flex flex-col items-center justify-center py-2 text-xs ";
                if (completed) {
                  cellClass +=
                    "bg-[--color-xp]/20 text-xp";
                } else if (isFuture) {
                  cellClass += "bg-[--color-bg-surface] text-muted";
                } else {
                  cellClass += "bg-[--color-hp]/15 text-hp";
                }
                if (isToday) cellClass += " ring-2 ring-[--color-gold]";

                return (
                  <div key={dateStr} className={cellClass}>
                    <span>{day}</span>
                    <span>
                      {completed ? (
                        <PixelIcon name="status-complete" size={16} />
                      ) : isFuture ? (
                        ""
                      ) : (
                        <PixelIcon name="status-failed" size={16} />
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
