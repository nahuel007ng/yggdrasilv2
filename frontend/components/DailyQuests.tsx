"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Quest {
  id: string;
  quest_type: string;
  description: string;
  target_count: number;
  current_count: number;
  is_completed: boolean;
  xp_reward: number;
}

function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DailyQuests({ className = "" }: { className?: string }) {
  const [quests, setQuests] = useState<Quest[] | null>(null);

  useEffect(() => {
    const today = ymdLocal(new Date());
    supabase
      .from("daily_quests")
      .select("*")
      .eq("date", today)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setQuests((data ?? []) as Quest[]);
      });
  }, []);

  // No renderizar nada mientras carga o si no hay quests para hoy
  if (quests === null) return null;
  if (quests.length === 0) return null;

  const completedCount = quests.filter((q) => q.is_completed).length;

  return (
    <div className={`pixel-card ${className}`}>
      <h3 className="pixel-card-title flex items-center gap-2">
        <span className="text-base">⚔️</span> Misiones del día ({completedCount}/{quests.length})
      </h3>
      <div className="flex flex-col gap-3 py-2">
        {quests.map((quest) => (
          <QuestItem key={quest.id} quest={quest} />
        ))}
      </div>
    </div>
  );
}

function QuestItem({ quest }: { quest: Quest }) {
  const progress = Math.min(quest.current_count, quest.target_count);
  const progressPercent =
    quest.target_count > 0 ? (progress / quest.target_count) * 100 : 0;

  return (
    <div
      className={`flex flex-col gap-1 p-2 ${quest.is_completed ? "opacity-60" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs ${quest.is_completed ? "line-through text-muted" : "text-[--color-text]"}`}
        >
          {quest.is_completed ? "✅" : "⬜"} {quest.description}
        </span>
        <span className="text-xs text-muted whitespace-nowrap">
          {quest.is_completed
            ? `+${quest.xp_reward} XP`
            : `${progress}/${quest.target_count}`}
        </span>
      </div>
      {!quest.is_completed && (
        <div className="pixel-progress" style={{ height: "6px" }}>
          <div
            className="pixel-progress-fill is-xp"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}