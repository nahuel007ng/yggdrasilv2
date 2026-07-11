"use client";

import PixelIcon from "@/components/PixelIcon";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  todo: "Por hacer",
  doing: "En progreso",
  done: "Hecha",
  archived: "Archivada",
};

const STATUS_COLORS: Record<string, string> = {
  todo: "text-muted",
  doing: "text-mana",
  done: "text-xp",
  archived: "text-muted",
};

const PRIORITY_SPRITES: Record<string, string> = {
  urgent_important: "priority-urgent-important",
  urgent_not_important: "priority-urgent-not-important",
  not_urgent_important: "priority-not-urgent-important",
  not_urgent_not_important: "priority-not-urgent-not-important",
};

export default function TaskCard({ task }: { task: Task }) {
  const isOverdue =
    task.due_date && task.status !== "done" && new Date(task.due_date) < new Date();

  return (
    <div className="pixel-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <PixelIcon name={PRIORITY_SPRITES[task.priority] ?? "priority-not-urgent-not-important"} size={16} className="shrink-0" />
            <span className="text-sm font-medium truncate">{task.title}</span>
          </div>
          {task.description && (
            <p className="text-muted text-xs truncate">{task.description}</p>
          )}
        </div>
        <span className={`text-pixel text-[9px] whitespace-nowrap ${STATUS_COLORS[task.status] ?? "text-muted"}`}>
          {STATUS_LABELS[task.status] ?? task.status}
        </span>
      </div>
      {task.due_date && (
        <div className={`text-xs mt-2 ${isOverdue ? "text-hp" : "text-muted"}`}>
          📅 {new Date(task.due_date).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
          {isOverdue && " (vencida)"}
        </div>
      )}
    </div>
  );
}
