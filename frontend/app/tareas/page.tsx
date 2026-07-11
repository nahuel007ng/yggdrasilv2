"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import TaskList from "@/components/TaskList";
import TaskKanban from "@/components/TaskKanban";
import { type Task } from "@/components/TaskCard";
import PixelIcon from "@/components/PixelIcon";

export default function TareasPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
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
        if (error) setError(error.message);
        else setTasks(data ?? []);
      });
  }, []);

  const filteredTasks =
    tasks?.filter((t) =>
      filterStatus === "all"
        ? t.status !== "archived"
        : t.status === filterStatus
    ) ?? [];

  if (error) {
    return (
      <div className="pixel-card">
        <h3 className="pixel-card-title">Tareas</h3>
        <div className="pixel-border-error p-4">
          <p className="text-hp">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pixel-card p-3">
        <div className="flex gap-2">
          <button
            type="button"
            className={viewMode === "list" ? "pixel-btn-primary pixel-btn" : "pixel-btn"}
            onClick={() => setViewMode("list")}
          >
            Lista
          </button>
          <button
            type="button"
            className={viewMode === "kanban" ? "pixel-btn-primary pixel-btn" : "pixel-btn"}
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
    </div>
  );
}
