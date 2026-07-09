"use client";

import TaskCard, { type Task } from "@/components/TaskCard";

interface TaskListProps {
  tasks: Task[];
}

export default function TaskList({ tasks }: TaskListProps) {
  return (
    <div>
      <p className="text-muted text-xs mb-3">{tasks.length} tarea{tasks.length !== 1 ? "s" : ""}</p>
      <div className="grid grid-cols-1 gap-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
