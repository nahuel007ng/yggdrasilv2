"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PixelIcon from "@/components/PixelIcon";

interface PRRecord {
  name: string;
  weight: number | null;
  reps: number | null;
  duration_seconds: number | null;
}

export default function PersonalRecords() {
  const [records, setRecords] = useState<PRRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("exercise_sets")
      .select("weight, reps, duration_seconds, exercises(name)")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error.message);
          return;
        }

        // Group by exercise name (lowercase) and find max weight per exercise
        const prMap: Record<
          string,
          { name: string; weight: number | null; reps: number | null; duration_seconds: number | null }
        > = {};

        for (const row of data ?? []) {
          const exerciseData = row.exercises as
            | { name: string }
            | { name: string }[]
            | null;
          const rawName = Array.isArray(exerciseData)
            ? exerciseData[0]?.name
            : exerciseData?.name;
          if (!rawName) continue;

          const key = rawName.toLowerCase();

          if (!prMap[key]) {
            prMap[key] = { name: rawName, weight: null, reps: null, duration_seconds: null };
          }

          const current = prMap[key];

          // PR by weight (highest weight wins, use reps at that weight)
          if (row.weight != null) {
            if (current.weight === null || row.weight > current.weight) {
              current.weight = row.weight;
              current.reps = row.reps;
            }
          }

          // PR by duration (for isometric exercises)
          if (row.duration_seconds != null) {
            if (
              current.duration_seconds === null ||
              row.duration_seconds > current.duration_seconds
            ) {
              current.duration_seconds = row.duration_seconds;
            }
          }

          // If no weight, track max reps (bodyweight exercises)
          if (row.weight == null && row.reps != null) {
            if (current.weight === null) {
              if (current.reps === null || row.reps > current.reps) {
                current.reps = row.reps;
              }
            }
          }
        }

        // Sort by weight descending, then by name
        const sorted = Object.values(prMap).sort((a, b) => {
          if (a.weight !== null && b.weight !== null) return b.weight - a.weight;
          if (a.weight !== null) return -1;
          if (b.weight !== null) return 1;
          return a.name.localeCompare(b.name);
        });

        setRecords(sorted.slice(0, 10));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title">Records personales</h3>

      {error && <p className="text-hp">Error: {error}</p>}
      {!error && records === null && <p className="text-muted">Cargando...</p>}

      {!error && records !== null && records.length === 0 && (
        <p className="text-muted text-sm">Sin records todavia</p>
      )}

      {!error && records !== null && records.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {records.map((pr) => {
            let detail: string;
            if (pr.weight != null) {
              detail = `${pr.weight}kg${pr.reps != null ? ` x ${pr.reps}` : ""}`;
            } else if (pr.duration_seconds != null) {
              detail = `${pr.duration_seconds}s`;
            } else if (pr.reps != null) {
              detail = `${pr.reps} reps`;
            } else {
              detail = "-";
            }

            return (
              <div
                key={pr.name}
                className="flex items-center gap-2 p-2 bg-[--color-bg] pixel-border"
              >
                <PixelIcon name="pr-trophy" size={20} className="shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{pr.name}</p>
                  <p className="text-mana text-xs">{detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
