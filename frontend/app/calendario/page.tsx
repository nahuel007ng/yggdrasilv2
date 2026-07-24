"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CalendarView from "@/components/CalendarView";
import TaskList from "@/components/TaskList";
import TaskKanban from "@/components/TaskKanban";
import { type Task } from "@/components/TaskCard";
import HabitCard, { type Habit } from "@/components/HabitCard";
import ShieldsIndicator from "@/components/ShieldsIndicator";
import PixelIcon from "@/components/PixelIcon";

export default function CalendarioPage() {
  // --- Tareas (movido tal cual de tareas/page.tsx) ---
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    supabase
      .from("tasks")
      .select(
        "id, title, description, status, priority, due_date, completed_at, created_at"
      )
      .eq("is_deleted", false)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setTasksError(error.message);
        else setTasks(data ?? []);
      });
  }, []);

  const filteredTasks =
    tasks?.filter((t) =>
      filterStatus === "all"
        ? t.status !== "archived"
        : t.status === filterStatus
    ) ?? [];

  // --- Hábitos (movido tal cual de habitos/page.tsx, SIN HabitCalendar) ---
  const [shields, setShields] = useState<number | null>(null);
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [habitsError, setHabitsError] = useState<string | null>(null);
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
      if (profileRes.error) setHabitsError(profileRes.error.message);
      else setShields(profileRes.data?.streak_shields ?? 0);
      if (habitsRes.error) setHabitsError(habitsRes.error.message);
      else setHabits(habitsRes.data ?? []);
    });
  }, []);

  // selectedHabitId: solo highlight visual local de la card (ya no alimenta
  // ningún calendario — HabitCalendar fue recortado en este refactor)
  const toggleHabit = (id: string) => {
    setSelectedHabitId((curr) => (curr === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="section-title">Calendario</h2>
        <CalendarView />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="section-title">Tareas</h2>
        {tasksError ? (
          <div className="pixel-card">
            <h3 className="pixel-card-title">Tareas</h3>
            <div className="pixel-border-error p-4">
              <p className="text-hp">Error: {tasksError}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pixel-card p-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  className={viewMode === "list" ? "pixel-btn border border-[--color-border-accent] shadow-[var(--glow-mana-soft)]" : "pixel-btn"}
                  onClick={() => setViewMode("list")}
                >
                  Lista
                </button>
                <button
                  type="button"
                  className={viewMode === "kanban" ? "pixel-btn border border-[--color-border-accent] shadow-[var(--glow-mana-soft)]" : "pixel-btn"}
                  onClick={() => setViewMode("kanban")}
                >
                  Kanban
                </button>
              </div>

              {viewMode === "list" && (
                <div className="flex gap-2 flex-wrap">
                  {[
                    { key: "all", label: "Todas" },
                    { key: "todo", label: "Por hacer" },
                    { key: "doing", label: "En progreso" },
                    { key: "done", label: "Hechas" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      className={`pixel-btn text-[9px] ${filterStatus === f.key ? "text-gold" : ""}`}
                      onClick={() => setFilterStatus(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            {tasks === null ? (
              <p className="text-muted">Cargando...</p>
            ) : tasks.length === 0 ? (
              <div className="pixel-card p-6 text-center">
                <p className="text-muted flex items-center justify-center gap-1">No hay tareas. Crea tu primera tarea via bot <PixelIcon name="nav-tareas" size={14} className="inline-block" /></p>
              </div>
            ) : viewMode === "list" ? (
              <TaskList tasks={filteredTasks} />
            ) : (
              <TaskKanban tasks={tasks} />
            )}
          </>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Hábitos</h2>
          {shields !== null && <ShieldsIndicator shields={shields} />}
        </div>
        {habitsError ? (
          <div className="pixel-card">
            <h3 className="pixel-card-title">Habitos</h3>
            <div className="pixel-border-error p-4">
              <p className="text-hp">Error: {habitsError}</p>
            </div>
          </div>
        ) : habits === null ? (
          <p className="text-muted">Cargando...</p>
        ) : habits.length === 0 ? (
          <p className="text-muted">No hay habitos registrados</p>
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
      </section>
    </div>
  );
}
