"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import HabitCalendar from "@/components/HabitCalendar";
import HabitCard, { type Habit } from "@/components/HabitCard";
import ShieldsIndicator from "@/components/ShieldsIndicator";

export default function HabitosPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [shields, setShields] = useState<number | null>(null);
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase
        .from("user_profile")
        .select("streak_shields")
        .maybeSingle(),
      supabase
        .from("habits")
        .select(
          "id, name, icon, current_streak, longest_streak, frequency"
        )
        .eq("is_archived", false)
        .order("current_streak", { ascending: false }),
    ]).then(([profileRes, habitsRes]) => {
      if (profileRes.error) setError(profileRes.error.message);
      else setShields(profileRes.data?.streak_shields ?? 0);
      if (habitsRes.error) setError(habitsRes.error.message);
      else setHabits(habitsRes.data ?? []);
    });
  }, []);

  const goPrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth() + 1;
  const canNext = !isCurrentMonth;
  const canPrev = true;

  const toggleHabit = (id: string) => {
    setSelectedHabitId((curr) => (curr === id ? null : id));
  };

  if (error) {
    return (
      <div className="nes-container is-dark with-title">
        <p className="title">Habitos</p>
        <div className="nes-container is-error">
          <p className="text-white">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        {shields !== null && <ShieldsIndicator shields={shields} />}
      </div>

      <HabitCalendar
        habitId={selectedHabitId}
        month={month}
        year={year}
        onPrev={goPrev}
        onNext={goNext}
        canPrev={canPrev}
        canNext={canNext}
      />

      <div>
        {habits === null ? (
          <p className="text-white">Cargando...</p>
        ) : habits.length === 0 ? (
          <p className="text-white">No hay habitos registrados</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                selected={selectedHabitId === habit.id}
                onSelect={() => toggleHabit(habit.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}