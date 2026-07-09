"use client";

import TaskCard, { type Task } from "@/components/TaskCard";

interface TaskKanbanProps {
  tasks: Task[];
}

const COLUMNS = [
  { key: "todo", label: "Por hacer" },
  { key: "doing", label: "En progreso" },
  { key: "done", label: "Hechas" },
] as const;

export default function TaskKanban({ tasks }: TaskKanbanProps) {
  const nonArchived = tasks.filter((t) => t.status !== "archived");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((col) => {
        const colTasks = nonArchived.filter((t) => t.status === col.key);
        return (
          <div key={col.key} className="pixel-card p-3">
            <h4 className="pixel-card-title">
              {col.label} ({colTasks.length})
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
