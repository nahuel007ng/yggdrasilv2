"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PixelIcon from "@/components/PixelIcon";

interface ExerciseSet {
  id: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  duration_seconds: number | null;
}

interface Exercise {
  id: string;
  name: string;
  sort_order: number;
  exercise_sets: ExerciseSet[];
}

interface Workout {
  id: string;
  date: string;
  duration_minutes: number | null;
  notes: string | null;
  exercises: Exercise[];
}

interface WorkoutHistoryProps {
  month: number;
  year: number;
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export default function WorkoutHistory({ month, year }: WorkoutHistoryProps) {
  const [workouts, setWorkouts] = useState<Workout[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = getLastDayOfMonth(year, month);
  const endOfMonth = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("workouts")
      .select(`
        id, date, duration_minutes, notes,
        exercises(id, name, sort_order,
          exercise_sets(id, set_number, reps, weight, duration_seconds)
        )
      `)
      .gte("date", startOfMonth)
      .lte("date", endOfMonth)
      .order("date", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error.message);
          return;
        }
        setWorkouts((data as unknown as Workout[]) ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, [startOfMonth, endOfMonth]);

  const toggle = (id: string) =>
    setExpandedId((curr) => (curr === id ? null : id));

  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title">Entrenamientos del mes</h3>

      {error && <p className="text-hp">Error: {error}</p>}
      {!error && workouts === null && <p className="text-muted">Cargando...</p>}

      {!error && workouts !== null && workouts.length === 0 && (
        <p className="text-muted text-sm">
          Sin entrenamientos este mes. Registra tu primer workout via bot <PixelIcon name="nav-entrenamientos" size={14} className="inline-block" />
        </p>
      )}

      {!error && workouts !== null && workouts.length > 0 && (
        <div className="flex flex-col gap-3">
          {workouts.map((w) => {
            const isExpanded = expandedId === w.id;
            const dateFormatted = new Date(w.date + "T12:00:00").toLocaleDateString(
              "es-AR",
              { weekday: "short", day: "numeric", month: "short" }
            );
            const exerciseCount = w.exercises?.length ?? 0;

            return (
              <div key={w.id}>
                <button
                  type="button"
                  className="w-full text-left p-3 bg-[--color-bg] pixel-border hover:bg-[--color-bg-surface-hover] transition-colors"
                  onClick={() => toggle(w.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{dateFormatted}</span>
                      <span className="text-muted text-xs ml-2">
                        {exerciseCount} ejercicio{exerciseCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {w.duration_minutes && (
                        <span className="text-muted text-xs">
                          {w.duration_minutes} min
                        </span>
                      )}
                      <span className="text-muted">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>
                </button>

                {isExpanded && w.exercises && w.exercises.length > 0 && (
                  <div className="p-3 bg-[--color-bg-deep] border-x border-b border-[--color-border]">
                    {w.exercises
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((ex) => (
                        <div key={ex.id} className="mb-3 last:mb-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{ex.name}</span>
                          </div>
                          {ex.exercise_sets && ex.exercise_sets.length > 0 && (
                            <table
                              className="w-full text-xs"
                              style={{ borderCollapse: "collapse" }}
                            >
                              <thead>
                                <tr className="border-b border-[--color-border]">
                                  <th className="py-1 pr-2 text-left text-muted font-normal">
                                    #
                                  </th>
                                  <th className="py-1 pr-2 text-left text-muted font-normal">
                                    Reps
                                  </th>
                                  <th className="py-1 pr-2 text-left text-muted font-normal">
                                    Peso
                                  </th>
                                  <th className="py-1 text-left text-muted font-normal">
                                    Dur.
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {ex.exercise_sets
                                  .sort((a, b) => a.set_number - b.set_number)
                                  .map((set) => (
                                    <tr
                                      key={set.id}
                                      className="border-b border-[--color-bg-surface-hover]"
                                    >
                                      <td className="py-1 pr-2">{set.set_number}</td>
                                      <td className="py-1 pr-2">
                                        {set.reps ?? "-"}
                                      </td>
                                      <td className="py-1 pr-2">
                                        {set.weight != null
                                          ? `${set.weight}kg`
                                          : "-"}
                                      </td>
                                      <td className="py-1">
                                        {set.duration_seconds != null
                                          ? `${set.duration_seconds}s`
                                          : "-"}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      ))}
                    {w.notes && (
                      <p className="text-muted text-xs mt-2 italic">
                        {w.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
