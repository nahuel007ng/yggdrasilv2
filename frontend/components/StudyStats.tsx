"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PixelIcon from "@/components/PixelIcon";

interface StudyStatsProps {
  month: number;
  year: number;
}

interface StatsState {
  totalHours: number;
  totalSessions: number;
  topSubject: string | null;
  avgDaily: number;
  error: string | null;
  loadedKey: string;
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export default function StudyStats({ month, year }: StudyStatsProps) {
  const currentKey = `${year}-${month}`;
  const [state, setState] = useState<StatsState>({
    totalHours: 0,
    totalSessions: 0,
    topSubject: null,
    avgDaily: 0,
    error: null,
    loadedKey: "",
  });

  const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = getLastDayOfMonth(year, month);
  const endOfMonth = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  useEffect(() => {
    const key = currentKey;
    let cancelled = false;

    supabase
      .from("study_sessions")
      .select("duration_minutes, subject_id, subjects(name)")
      .gte("start_time", `${startOfMonth}T00:00:00`)
      .lte("start_time", `${endOfMonth}T23:59:59`)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState((s) => ({ ...s, error: error.message, loadedKey: key }));
          return;
        }

        const sessions = data ?? [];
        const totalMinutes = sessions.reduce(
          (sum, s) => sum + (Number(s.duration_minutes) || 0),
          0
        );
        const totalHours = totalMinutes / 60;
        const totalSessions = sessions.length;

        // Top subject by total minutes
        const minutesBySubject: Record<string, { name: string; minutes: number }> = {};
        for (const s of sessions) {
          if (s.subject_id && s.duration_minutes != null) {
            const subjectData = s.subjects as
              | { name: string }
              | { name: string }[]
              | null;
            const subjectName = Array.isArray(subjectData)
              ? subjectData[0]?.name ?? "Desconocida"
              : subjectData?.name ?? "Desconocida";
            if (!minutesBySubject[s.subject_id]) {
              minutesBySubject[s.subject_id] = { name: subjectName, minutes: 0 };
            }
            minutesBySubject[s.subject_id].minutes += Number(s.duration_minutes);
          }
        }

        let topSubject: string | null = null;
        let topMinutes = 0;
        for (const entry of Object.values(minutesBySubject)) {
          if (entry.minutes > topMinutes) {
            topMinutes = entry.minutes;
            topSubject = entry.name;
          }
        }

        // Average daily: total hours / days elapsed in month
        const today = new Date();
        const isCurrentMonth =
          year === today.getFullYear() && month === today.getMonth() + 1;
        const daysElapsed = isCurrentMonth ? today.getDate() : lastDay;
        const avgDaily = daysElapsed > 0 ? totalHours / daysElapsed : 0;

        setState({
          totalHours,
          totalSessions,
          topSubject,
          avgDaily,
          error: null,
          loadedKey: key,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [currentKey, startOfMonth, endOfMonth, month, year, lastDay]);

  const isLoading = state.loadedKey !== currentKey;

  if (state.error) {
    return (
      <div className="pixel-card pixel-border-error">
        <p className="text-hp">Error: {state.error}</p>
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-muted">Cargando stats...</p>;
  }

  if (state.totalSessions === 0) {
    return (
      <div className="pixel-card p-6 text-center">
        <p className="text-muted">Sin sesiones de estudio este mes</p>
      </div>
    );
  }

  return (
    <div className="pixel-card pixel-card-hover">
      <h3 className="pixel-card-title">Stats del mes</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="group">
          <div className="flex items-center gap-1 mb-1">
            <PixelIcon name="stat-hours" size={16} className="shrink-0 transition-[filter] group-hover:drop-shadow-[0_0_4px_rgba(45,212,191,0.4)]" />
            <p className="text-muted text-xs">Total horas</p>
          </div>
          <p className="text-pixel text-mana text-lg font-semibold">
            {state.totalHours.toFixed(1)}h
          </p>
        </div>
        <div className="group">
          <div className="flex items-center gap-1 mb-1">
            <PixelIcon name="stat-sessions" size={16} className="shrink-0 transition-[filter] group-hover:drop-shadow-[0_0_4px_rgba(45,212,191,0.4)]" />
            <p className="text-muted text-xs">Sesiones</p>
          </div>
          <p className="text-pixel text-gold text-lg font-semibold">
            {state.totalSessions}
          </p>
        </div>
        <div className="group">
          <div className="flex items-center gap-1 mb-1">
            <PixelIcon name="stat-top" size={16} className="shrink-0 transition-[filter] group-hover:drop-shadow-[0_0_4px_rgba(45,212,191,0.4)]" />
            <p className="text-muted text-xs">Mas estudiada</p>
          </div>
          <p className="text-pixel text-gold text-sm font-semibold">
            {state.topSubject ?? "-"}
          </p>
        </div>
        <div className="group">
          <div className="flex items-center gap-1 mb-1">
            <PixelIcon name="stat-average" size={16} className="shrink-0 transition-[filter] group-hover:drop-shadow-[0_0_4px_rgba(45,212,191,0.4)]" />
            <p className="text-muted text-xs">Promedio diario</p>
          </div>
          <p className="text-pixel text-mana text-lg font-semibold">
            {state.avgDaily.toFixed(1)}h
          </p>
        </div>
      </div>
    </div>
  );
}
