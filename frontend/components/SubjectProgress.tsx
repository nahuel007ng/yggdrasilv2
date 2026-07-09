"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Subject {
  id: string;
  name: string;
  target_hours: number | null;
  color: string | null;
}

interface SubjectWithHours extends Subject {
  totalHours: number;
}

export default function SubjectProgress() {
  const [subjects, setSubjects] = useState<SubjectWithHours[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      supabase
        .from("subjects")
        .select("id, name, target_hours, color")
        .eq("is_active", true)
        .order("name"),
      supabase.from("study_sessions").select("subject_id, duration_minutes"),
    ]).then(([subjectsRes, sessionsRes]) => {
      if (cancelled) return;
      if (subjectsRes.error) {
        setError(subjectsRes.error.message);
        return;
      }
      if (sessionsRes.error) {
        setError(sessionsRes.error.message);
        return;
      }

      const hoursBySubject: Record<string, number> = {};
      for (const s of sessionsRes.data ?? []) {
        if (s.duration_minutes != null) {
          hoursBySubject[s.subject_id] =
            (hoursBySubject[s.subject_id] ?? 0) + Number(s.duration_minutes);
        }
      }

      const result: SubjectWithHours[] = (subjectsRes.data ?? []).map(
        (sub: Subject) => ({
          ...sub,
          totalHours: (hoursBySubject[sub.id] ?? 0) / 60,
        })
      );

      setSubjects(result);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="pixel-card pixel-border-error">
        <p className="text-hp">Error: {error}</p>
      </div>
    );
  }

  if (subjects === null) {
    return <p className="text-muted">Cargando materias...</p>;
  }

  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title">Progreso por materia</h3>
      {subjects.length === 0 ? (
        <p className="text-muted text-sm">No hay materias activas</p>
      ) : (
        <div className="flex flex-col gap-4">
          {subjects.map((sub) => {
            const pct =
              sub.target_hours && sub.target_hours > 0
                ? Math.min(
                    Math.round((sub.totalHours / sub.target_hours) * 100),
                    100
                  )
                : null;

            return (
              <div key={sub.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-pixel text-xs">{sub.name}</span>
                  <span className="text-muted text-xs">
                    {sub.totalHours.toFixed(1)}h
                    {sub.target_hours ? ` / ${sub.target_hours}h` : " acumuladas"}
                  </span>
                </div>
                <div className="pixel-progress">
                  <div
                    className="pixel-progress-fill is-mana"
                    style={{
                      width: pct !== null ? `${pct}%` : sub.totalHours > 0 ? "100%" : "0%",
                      backgroundColor: sub.color ?? undefined,
                      opacity: pct !== null ? 1 : 0.4,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
