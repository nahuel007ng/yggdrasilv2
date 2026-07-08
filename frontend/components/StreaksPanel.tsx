"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
    <div className="nes-container is-dark with-title h-full">
      <p className="title">Rachas activas</p>
      <div className="flex flex-col gap-2 py-2">
        {error && <p className="nes-text is-error">Error: {error}</p>}
        {!error && habits === null && <p>Cargando...</p>}
        {!error && habits !== null && habits.length === 0 && (
          <p className="text-white">No hay habitos registrados</p>
        )}
        {habits?.map((habit, i) => (
          <p
            key={`${habit.name}-${i}`}
            className={
              habit.current_streak > 0
                ? "nes-text is-success"
                : "text-gray-400"
            }
          >
            🔥 {habit.name}: {habit.current_streak} dias (record:{" "}
            {habit.longest_streak})
          </p>
        ))}
      </div>
    </div>
  );
}