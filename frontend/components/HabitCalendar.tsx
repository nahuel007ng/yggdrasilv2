"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
    <div className="nes-container is-dark with-title">
      <p className="title">Calendario — {monthTitle}</p>
      <div className="flex flex-col gap-2 py-2">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            className="nes-btn"
            onClick={onPrev}
            disabled={!canPrev}
          >
            ◀
          </button>
          <span className="nes-text is-primary text-xs">{monthTitle}</span>
          <button
            type="button"
            className="nes-btn"
            onClick={onNext}
            disabled={!canNext}
          >
            ▶
          </button>
        </div>

        {error && <p className="nes-text is-error">Error: {error}</p>}
        {!error && records === null && <p>Cargando...</p>}

        {!error && records !== null && (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-1 min-w-[280px]">
              {DOW_LABELS.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] text-gray-300 py-1"
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
                  "flex flex-col items-center justify-center py-2 text-[10px] border-2 ";
                if (completed) {
                  cellClass += "bg-green-700 border-green-500 text-white";
                } else if (isFuture) {
                  cellClass += "bg-gray-700 border-gray-600 text-gray-400";
                } else {
                  cellClass += "bg-red-900 border-red-700 text-red-200";
                }
                if (isToday) cellClass += " ring-2 ring-yellow-400";

                return (
                  <div key={dateStr} className={cellClass}>
                    <span>{day}</span>
                    <span>
                      {completed ? "✅" : isFuture ? "" : "❌"}
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