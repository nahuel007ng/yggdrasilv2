"use client";

import PixelIcon from "@/components/PixelIcon";

export interface Habit {
  id: string;
  name: string;
  icon: string | null;
  current_streak: number;
  longest_streak: number;
  frequency: string;
}

export interface HabitCardProps {
  habit: Habit;
  selected: boolean;
  onSelect: () => void;
}

export default function HabitCard({ habit, selected, onSelect }: HabitCardProps) {
  const icon = habit.icon || "📌";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`pixel-card pixel-card-hover text-left w-full cursor-pointer transition-all
        ${selected ? "pixel-border-accent" : ""}
        ${habit.current_streak === 0 ? "opacity-70" : ""}
      `}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm font-semibold break-words text-[--color-text]">
          {habit.name}
        </span>
      </div>
      <p className="text-xs flex items-center gap-1">
        <span style={{ filter: "drop-shadow(0 0 6px rgba(255, 138, 92, 0.5))" }}>
          <PixelIcon name="streak-fire" size={14} />
        </span>
        <span className="text-pixel text-coral">
          Racha: {habit.current_streak} dias
        </span>
      </p>
      <p className="text-muted text-xs flex items-center gap-1">
        <PixelIcon name="pr-trophy" size={14} /> Record: {habit.longest_streak} dias
      </p>
      <p className="text-muted text-xs">Frecuencia: {habit.frequency}</p>
    </button>
  );
}
