"use client";

import TaskCard, { type Task } from "@/components/TaskCard";

interface TaskKanbanProps {
  tasks: Task[];
}

const COLUMNS = [
  { key: "todo", label: "Por hacer", colorClass: "text-muted" },
  { key: "doing", label: "En progreso", colorClass: "text-mana" },
  { key: "done", label: "Hechas", colorClass: "text-xp" },
] as const;

export default function TaskKanban({ tasks }: TaskKanbanProps) {
  const nonArchived = tasks.filter((t) => t.status !== "archived");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((col) => {
        const colTasks = nonArchived.filter((t) => t.status === col.key);
        return (
          <div key={col.key} className="p-3 bg-[--color-bg] pixel-border">
            <h4 className={`text-pixel text-xs mb-2 ${col.colorClass}`}>
              {col.label} <span className="text-muted">({colTasks.length})</span>
            </h4>
            {colTasks.length === 0 ? (
              <p className="text-muted text-xs">Sin tareas</p>
            ) : (
              <div className="flex flex-col gap-3">
                {colTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
