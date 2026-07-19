"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PixelIcon from "@/components/PixelIcon";

interface HabitRow {
  name: string;
  current_streak: number;
  longest_streak: number;
}

export default function StreaksPanel() {
  const [habits, setHabits] = useState<HabitRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("habits")
      .select("name, current_streak, longest_streak")
      .eq("is_archived", false)
      .order("current_streak", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setHabits(data ?? []);
      });
  }, []);

  return (
    <div className="pixel-card h-full">
      <h3 className="pixel-card-title">Rachas activas</h3>
      <div className="flex flex-col gap-2 py-2">
        {error && <p className="text-hp">Error: {error}</p>}
        {!error && habits === null && <p className="text-muted">Cargando...</p>}
        {!error && habits !== null && habits.length === 0 && (
          <p className="text-muted">No hay habitos registrados</p>
        )}
        {habits?.map((habit, i) => (
          <div
            key={`${habit.name}-${i}`}
            className={`flex items-center gap-2 px-3 py-2 rounded ${
              habit.current_streak > 0 ? "bg-[--color-bg-surface-hover]" : ""
            }`}
          >
            <span
              className="shrink-0"
              style={{ filter: "drop-shadow(0 0 6px rgba(255, 138, 92, 0.5))" }}
            >
              <PixelIcon name="streak-fire" size={20} />
            </span>
            <span className="flex-1 text-[--color-text]">
              {habit.name}
            </span>
            <span className="text-pixel text-coral">
              {habit.current_streak} días
            </span>
            <span className="text-muted text-xs ml-auto">
              (record: {habit.longest_streak})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
