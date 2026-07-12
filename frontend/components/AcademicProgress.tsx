"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type SubjectStatus = "aprobada" | "cursando" | "pendiente";

interface Subject {
  id: string;
  name: string;
  code: number | null;
  status: SubjectStatus | null;
  grade: number | null;
  year: number | null;
  semester: number | null;
  correlative_codes: number[] | null;
}

type DisplayStatus = SubjectStatus | "disponible";

type YearFilter = "all" | 1 | 2 | 3 | 4 | 5;
type StatusFilter = "all" | DisplayStatus;

const YEAR_FILTERS: { label: string; value: YearFilter }[] = [
  { label: "Todos", value: "all" },
  { label: "1°", value: 1 },
  { label: "2°", value: 2 },
  { label: "3°", value: 3 },
  { label: "4°", value: 4 },
  { label: "5°", value: 5 },
];

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "Todas", value: "all" },
  { label: "Aprobada", value: "aprobada" },
  { label: "Cursando", value: "cursando" },
  { label: "Disponible", value: "disponible" },
  { label: "Pendiente", value: "pendiente" },
];

function isAvailable(subject: Subject, allSubjects: Subject[]): boolean {
  if ((subject.status ?? "pendiente") !== "pendiente") return false;
  const codes = subject.correlative_codes ?? [];
  if (codes.length === 0) return true;
  return codes.every((code) => {
    const req = allSubjects.find((s) => s.code === code);
    return req && req.status === "aprobada";
  });
}

function getDisplayStatus(
  subject: Subject,
  allSubjects: Subject[]
): DisplayStatus {
  const status = subject.status ?? "pendiente";
  if (status === "pendiente" && isAvailable(subject, allSubjects)) {
    return "disponible";
  }
  return status;
}

const STATUS_META: Record<
  DisplayStatus,
  { icon: string; color: string; label: string }
> = {
  aprobada: { icon: "✅", color: "var(--color-xp)", label: "Aprobada" },
  cursando: { icon: "🟡", color: "var(--color-gold)", label: "Cursando" },
  disponible: { icon: "🔓", color: "var(--color-mana)", label: "Disponible" },
  pendiente: { icon: "🔒", color: "var(--color-text-muted)", label: "Pendiente" },
};

function ordinal(n: number): string {
  return `${n}°`;
}

export default function AcademicProgress() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<YearFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("subjects")
      .select(
        "id, name, code, status, grade, year, semester, correlative_codes"
      )
      .order("code", { ascending: true })
      .then((res) => {
        if (cancelled) return;
        if (res.error) {
          setError(res.error.message);
          return;
        }
        setSubjects(res.data as Subject[]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const approvedCount = useMemo(() => {
    if (!subjects) return 0;
    return subjects.filter((s) => s.status === "aprobada").length;
  }, [subjects]);

  const filtered = useMemo(() => {
    if (!subjects) return [];
    return subjects.filter((s) => {
      if (yearFilter !== "all" && s.year !== yearFilter) return false;
      if (statusFilter !== "all") {
        const display = getDisplayStatus(s, subjects);
        if (display !== statusFilter) return false;
      }
      return true;
    });
  }, [subjects, yearFilter, statusFilter]);

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

  const total = subjects.length;
  const pct = total > 0 ? Math.round((approvedCount / total) * 100) : 0;

  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title">Progreso Academico</h3>

      <div className="flex items-center justify-between mb-2">
        <span className="text-pixel text-xs">
          {approvedCount}/{total}
        </span>
        <span className="text-muted text-xs">{pct}%</span>
      </div>
      <div className="pixel-progress mb-4">
        <div
          className="pixel-progress-fill is-xp"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {YEAR_FILTERS.map((f) => {
          const active = yearFilter === f.value;
          return (
            <button
              key={String(f.value)}
              type="button"
              className="pixel-btn"
              style={active ? { background: "var(--color-mana)", color: "#fff" } : undefined}
              onClick={() => setYearFilter(f.value)}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              className="pixel-btn"
              style={active ? { background: "var(--color-mana)", color: "#fff" } : undefined}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted text-sm">No hay materias que coincidan.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((s) => {
            const display = getDisplayStatus(s, subjects!);
            const meta = STATUS_META[display];
            const codes = s.correlative_codes ?? [];
            const missing = codes.filter((code) => {
              const req = subjects!.find((x) => x.code === code);
              return !req || req.status !== "aprobada";
            });

            return (
              <div
                key={s.id}
                className="pixel-border"
                style={{
                  background: "var(--color-bg)",
                  padding: "var(--space-3)",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-pixel text-xs flex items-center gap-2">
                    <span>{meta.icon}</span>
                    {s.name}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-gold)" }}
                  >
                    {s.status === "aprobada" && s.grade != null
                      ? `Nota: ${s.grade}`
                      : "-"}
                  </span>
                </div>

                <div className="text-muted text-xs mb-1">
                  {s.year ? `${ordinal(s.year)} Año` : "Sin año"}
                  {s.semester ? ` · ${s.semester}° Cuatri` : ""}
                </div>

                {codes.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-muted text-xs">Req: </span>
                    {codes.map((code) => {
                      const req = subjects!.find((x) => x.code === code);
                      const ok = req && req.status === "aprobada";
                      return (
                        <span
                          key={code}
                          className="text-xs"
                          style={{
                            color: ok ? "var(--color-xp)" : "var(--color-hp)",
                          }}
                        >
                          {req?.name ?? `#${code}`}
                          {ok ? " ✅" : " ❌"}
                        </span>
                      );
                    })}
                    {missing.length > 0 && (
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        (faltan {missing.length})
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-muted text-xs mt-1">Sin correlativas</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}