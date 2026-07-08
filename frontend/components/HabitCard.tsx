"use client";

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

  let containerClass = "nes-container is-dark";
  if (habit.current_streak >= 7) containerClass += " is-success";
  else if (habit.current_streak === 0) containerClass += " is-error";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${containerClass} text-left p-3 cursor-pointer w-full ${
        selected ? "ring-4 ring-yellow-400" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="nes-text is-primary text-xs break-words">
          {habit.name}
        </span>
      </div>
      <p className="nes-text is-success text-[10px]">
        🔥 Racha: {habit.current_streak} dias
      </p>
      <p className="text-white text-[10px]">
        🏆 Record: {habit.longest_streak} dias
      </p>
      <p className="text-gray-300 text-[10px]">
        Frecuencia: {habit.frequency}
      </p>
    </button>
  );
}