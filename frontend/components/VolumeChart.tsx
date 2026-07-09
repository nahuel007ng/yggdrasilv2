"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase";

interface VolumeChartProps {
  month: number;
  year: number;
}

interface WeekVolume {
  week: string;
  volume: number;
  workouts: number;
}

interface ChartState {
  data: WeekVolume[];
  error: string | null;
  loadedKey: string;
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getWeekOfMonth(day: number): number {
  return Math.ceil(day / 7);
}

export default function VolumeChart({ month, year }: VolumeChartProps) {
  const currentKey = `${year}-${month}`;
  const [state, setState] = useState<ChartState>({
    data: [],
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
      .from("workouts")
      .select(`
        id, date,
        exercises(
          exercise_sets(weight, reps)
        )
      `)
      .gte("date", startOfMonth)
      .lte("date", endOfMonth)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState({ data: [], error: error.message, loadedKey: key });
          return;
        }

        // Group volume by week
        const weekMap: Record<number, { volume: number; workoutIds: Set<string> }> = {};

        for (const workout of data ?? []) {
          const day = parseInt(workout.date?.slice(8, 10) ?? "1", 10);
          const week = getWeekOfMonth(day);

          if (!weekMap[week]) {
            weekMap[week] = { volume: 0, workoutIds: new Set() };
          }
          weekMap[week].workoutIds.add(workout.id);

          const exercises = (workout.exercises ?? []) as {
            exercise_sets: { weight: number | null; reps: number | null }[];
          }[];

          for (const ex of exercises) {
            for (const set of ex.exercise_sets ?? []) {
              if (set.weight != null && set.reps != null) {
                weekMap[week].volume += set.weight * set.reps;
              } else if (set.reps != null) {
                weekMap[week].volume += set.reps;
              }
            }
          }
        }

        // Build chart data for all weeks in month
        const totalWeeks = getWeekOfMonth(lastDay);
        const chartData: WeekVolume[] = [];
        for (let w = 1; w <= totalWeeks; w++) {
          chartData.push({
            week: `Sem ${w}`,
            volume: Math.round(weekMap[w]?.volume ?? 0),
            workouts: weekMap[w]?.workoutIds.size ?? 0,
          });
        }

        setState({ data: chartData, error: null, loadedKey: key });
      });

    return () => {
      cancelled = true;
    };
  }, [currentKey, startOfMonth, endOfMonth, lastDay]);

  const isLoading = state.loadedKey !== currentKey;

  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title">Volumen semanal</h3>
      <div className="py-2">
        {state.error && <p className="text-hp">Error: {state.error}</p>}
        {!state.error && isLoading && (
          <p className="text-muted">Cargando...</p>
        )}
        {!state.error && !isLoading && state.data.every((d) => d.volume === 0) && (
          <p className="text-muted text-sm">Sin datos de volumen este mes</p>
        )}
        {!state.error &&
          !isLoading &&
          state.data.some((d) => d.volume > 0) && (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={state.data}>
                <XAxis
                  dataKey="week"
                  tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                />
                <YAxis
                  tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-bg-surface)",
                    border: "2px solid var(--color-border)",
                    color: "var(--color-text)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                  }}
                  formatter={(value) =>
                    [`${Number(value).toLocaleString()} kg·reps`, "Volumen"]
                  }
                />
                <Bar dataKey="volume" fill="#4a9e8e" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
      </div>
    </div>
  );
}
