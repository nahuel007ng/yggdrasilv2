"use client";

import { useCallback, useEffect, useState } from "react";
import { configApi } from "@/lib/configApi";
import { DeleteButton, ErrorBox } from "@/components/config/ui";

type SubjectOption = { id: string; name: string; code: number | null };

type ExamRow = {
  id: string;
  subject_id: string;
  type: string;
  grade: number | null;
  date: string | null;
  notes: string | null;
  subjects?: { name: string } | { name: string }[] | null;
};

const EXAM_TYPES = [
  { value: "parcial", label: "Parcial" },
  { value: "tp", label: "TP" },
  { value: "final", label: "Final" },
  { value: "otro", label: "Otro" },
];

function typeLabel(t: string): string {
  return EXAM_TYPES.find((x) => x.value === t)?.label ?? t;
}

function subjectNameOf(e: ExamRow): string {
  // El join `subjects(name)` llega como objeto (many-to-one); defensivo por si viene array.
  const s = Array.isArray(e.subjects) ? e.subjects[0] : e.subjects;
  return s?.name ?? "Materia";
}

type Draft = { type: string; grade: string; date: string; notes: string };

const EMPTY_DRAFT: Draft = { type: "final", grade: "", date: "", notes: "" };

function typeSelect(value: string, onChange: (v: string) => void) {
  return (
    <select
      className="pixel-input"
      style={{ width: "auto" }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Tipo de examen"
    >
      {EXAM_TYPES.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  );
}

export default function ExamsPanel() {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [exams, setExams] = useState<ExamRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY_DRAFT);

  const load = useCallback(() => {
    configApi<ExamRow[]>("/api/academico/exams")
      .then((data) => setExams(data))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    load();
    configApi<SubjectOption[]>("/api/academico/subjects")
      .then((data) => {
        setSubjects(data);
        if (data.length > 0) setSubjectId((curr) => curr || data[0].id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    setSaving(true);
    setError(null);
    try {
      await fn();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const create = () =>
    run(async () => {
      await configApi("/api/academico/exams", {
        method: "POST",
        body: JSON.stringify({
          subject_id: subjectId,
          type: draft.type,
          grade: draft.grade.trim() === "" ? null : Number(draft.grade),
          date: draft.date || null,
          notes: draft.notes.trim() || null,
        }),
      });
      setDraft(EMPTY_DRAFT);
    });

  const saveEdit = (id: string) =>
    run(async () => {
      await configApi(`/api/academico/exams/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          type: editDraft.type,
          grade:
            editDraft.grade.trim() === "" ? null : Number(editDraft.grade),
          date: editDraft.date || null,
          notes: editDraft.notes.trim() || null,
        }),
      });
      setEditId(null);
    });

  const remove = (id: string) =>
    run(async () => {
      await configApi(`/api/academico/exams/${id}`, { method: "DELETE" });
    });

  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title">Exámenes</h3>
      {error && <ErrorBox message={error} />}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          className="pixel-input"
          style={{ width: "auto", maxWidth: 220 }}
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          aria-label="Materia"
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {typeSelect(draft.type, (v) => setDraft({ ...draft, type: v }))}
        <input
          className="pixel-input"
          style={{ width: 80 }}
          type="number"
          step="0.5"
          min={0}
          max={10}
          placeholder="Nota"
          value={draft.grade}
          onChange={(e) => setDraft({ ...draft, grade: e.target.value })}
          aria-label="Nota (opcional)"
        />
        <input
          className="pixel-input"
          style={{ width: "auto" }}
          type="date"
          value={draft.date}
          onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          aria-label="Fecha (opcional)"
        />
        <input
          className="pixel-input"
          style={{ width: 160 }}
          placeholder="Notas (opcional)"
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        />
        <button
          type="button"
          className="pixel-btn pixel-btn-primary"
          disabled={saving || !subjectId}
          onClick={create}
        >
          Agregar
        </button>
      </div>

      {exams === null ? (
        <p className="text-muted">Cargando...</p>
      ) : exams.length === 0 ? (
        <p className="text-muted">No hay exámenes registrados</p>
      ) : (
        <ul className="flex flex-col">
          {exams.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center gap-2 py-2"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              {editId === e.id ? (
                <>
                  {typeSelect(editDraft.type, (v) =>
                    setEditDraft({ ...editDraft, type: v })
                  )}
                  <input
                    className="pixel-input"
                    style={{ width: 80 }}
                    type="number"
                    step="0.5"
                    min={0}
                    max={10}
                    placeholder="Nota"
                    value={editDraft.grade}
                    onChange={(ev) =>
                      setEditDraft({ ...editDraft, grade: ev.target.value })
                    }
                    aria-label="Nota"
                  />
                  <input
                    className="pixel-input"
                    style={{ width: "auto" }}
                    type="date"
                    value={editDraft.date}
                    onChange={(ev) =>
                      setEditDraft({ ...editDraft, date: ev.target.value })
                    }
                    aria-label="Fecha"
                  />
                  <input
                    className="pixel-input"
                    style={{ width: 140 }}
                    placeholder="Notas"
                    value={editDraft.notes}
                    onChange={(ev) =>
                      setEditDraft({ ...editDraft, notes: ev.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="pixel-btn pixel-btn-primary"
                    disabled={saving}
                    onClick={() => saveEdit(e.id)}
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="pixel-btn"
                    onClick={() => setEditId(null)}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="text-muted text-xs"
                    style={{ minWidth: 90, fontFamily: "var(--font-mono)" }}
                  >
                    {e.date ?? "sin fecha"}
                  </span>
                  <span className="flex-1">
                    {subjectNameOf(e)}{" "}
                    <span className="text-muted text-xs">
                      ({typeLabel(e.type)})
                    </span>
                  </span>
                  {e.grade != null && (
                    <span className="text-gold text-xs">Nota: {e.grade}</span>
                  )}
                  {e.notes && (
                    <span className="text-muted text-xs">{e.notes}</span>
                  )}
                  <button
                    type="button"
                    className="pixel-btn"
                    disabled={saving}
                    onClick={() => {
                      setEditId(e.id);
                      setEditDraft({
                        type: e.type,
                        grade: e.grade == null ? "" : String(e.grade),
                        date: e.date ?? "",
                        notes: e.notes ?? "",
                      });
                    }}
                  >
                    Editar
                  </button>
                  <DeleteButton
                    disabled={saving}
                    onConfirm={() => remove(e.id)}
                  />
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
