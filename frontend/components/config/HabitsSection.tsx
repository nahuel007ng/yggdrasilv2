"use client";

import { useCallback, useEffect, useState } from "react";
import { configApi, type ConfigHabit } from "@/lib/configApi";
import { ColorField, DeleteButton, ErrorBox } from "@/components/config/ui";

type Draft = {
  name: string;
  icon: string;
  color: string;
  frequency: string;
  xpOverride: string;
};

const EMPTY_DRAFT: Draft = {
  name: "",
  icon: "",
  color: "#8a93c2",
  frequency: "daily",
  xpOverride: "",
};

function toDraft(h: ConfigHabit): Draft {
  return {
    name: h.name,
    icon: h.icon ?? "",
    color: h.color ?? "",
    frequency: h.frequency ?? "daily",
    xpOverride: h.xp_override == null ? "" : String(h.xp_override),
  };
}

function FrequencySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const options = ["daily", "weekly"];
  if (value && !options.includes(value)) options.push(value);
  return (
    <select
      className="pixel-input"
      style={{ width: "auto" }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Frecuencia"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o === "daily" ? "Diario" : o === "weekly" ? "Semanal" : o}
        </option>
      ))}
    </select>
  );
}

export default function HabitsSection() {
  const [items, setItems] = useState<ConfigHabit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY_DRAFT);

  const load = useCallback(() => {
    configApi<ConfigHabit[]>("/api/config/habits")
      .then((data) => setItems(data))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    load();
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
      const body: Record<string, unknown> = {
        name: draft.name.trim(),
        icon: draft.icon.trim() || null,
        color: draft.color.trim() || null,
        frequency: draft.frequency,
      };
      if (draft.xpOverride.trim() !== "") {
        body.xp_override = Number(draft.xpOverride);
      }
      await configApi("/api/config/habits", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setDraft(EMPTY_DRAFT);
    });

  const saveEdit = (id: string) =>
    run(async () => {
      await configApi(`/api/config/habits/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editDraft.name.trim(),
          icon: editDraft.icon.trim() || null,
          color: editDraft.color.trim() || null,
          frequency: editDraft.frequency,
          // Vacío = limpiar el override (vuelve al XP por defecto de TOGGLE_HABIT)
          xp_override:
            editDraft.xpOverride.trim() === ""
              ? null
              : Number(editDraft.xpOverride),
        }),
      });
      setEditId(null);
    });

  const remove = (id: string) =>
    run(async () => {
      await configApi(`/api/config/habits/${id}`, { method: "DELETE" });
    });

  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title">Hábitos</h3>
      {error && <ErrorBox message={error} />}

      <p className="text-muted text-xs mb-3">
        Los hábitos son binarios (hecho / no hecho). XP al marcarlo hecho
        (dejar vacío = 15 por defecto).
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          className="pixel-input"
          style={{ width: 180 }}
          placeholder="Nombre"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <input
          className="pixel-input"
          style={{ width: 70 }}
          placeholder="Icono"
          value={draft.icon}
          onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
        />
        <ColorField
          value={draft.color}
          onChange={(v) => setDraft({ ...draft, color: v })}
        />
        <FrequencySelect
          value={draft.frequency}
          onChange={(v) => setDraft({ ...draft, frequency: v })}
        />
        <input
          className="pixel-input"
          style={{ width: 90 }}
          type="number"
          min={0}
          placeholder="XP"
          value={draft.xpOverride}
          onChange={(e) => setDraft({ ...draft, xpOverride: e.target.value })}
          aria-label="XP al marcarlo hecho"
        />
        <button
          type="button"
          className="pixel-btn pixel-btn-primary"
          disabled={saving || !draft.name.trim()}
          onClick={create}
        >
          Agregar
        </button>
      </div>

      {items === null ? (
        <p className="text-muted">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-muted">No hay hábitos</p>
      ) : (
        <ul className="flex flex-col">
          {items.map((h) => (
            <li
              key={h.id}
              className="flex flex-wrap items-center gap-2 py-2"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              {editId === h.id ? (
                <>
                  <input
                    className="pixel-input"
                    style={{ width: 160 }}
                    value={editDraft.name}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, name: e.target.value })
                    }
                  />
                  <input
                    className="pixel-input"
                    style={{ width: 70 }}
                    value={editDraft.icon}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, icon: e.target.value })
                    }
                  />
                  <ColorField
                    value={editDraft.color}
                    onChange={(v) => setEditDraft({ ...editDraft, color: v })}
                  />
                  <FrequencySelect
                    value={editDraft.frequency}
                    onChange={(v) =>
                      setEditDraft({ ...editDraft, frequency: v })
                    }
                  />
                  <input
                    className="pixel-input"
                    style={{ width: 90 }}
                    type="number"
                    min={0}
                    placeholder="XP"
                    value={editDraft.xpOverride}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, xpOverride: e.target.value })
                    }
                    aria-label="XP al marcarlo hecho"
                  />
                  <button
                    type="button"
                    className="pixel-btn pixel-btn-primary"
                    disabled={saving || !editDraft.name.trim()}
                    onClick={() => saveEdit(h.id)}
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
                  <span style={{ width: 24, textAlign: "center" }}>{h.icon}</span>
                  <span className="flex-1">{h.name}</span>
                  <span className="text-muted text-xs">
                    {h.frequency === "daily"
                      ? "Diario"
                      : h.frequency === "weekly"
                        ? "Semanal"
                        : h.frequency}
                  </span>
                  <span className="text-muted text-xs">
                    {h.xp_override == null
                      ? "XP: 15 (default)"
                      : `XP: ${h.xp_override}`}
                  </span>
                  <button
                    type="button"
                    className="pixel-btn"
                    disabled={saving}
                    onClick={() => {
                      setEditId(h.id);
                      setEditDraft(toDraft(h));
                    }}
                  >
                    Editar
                  </button>
                  <DeleteButton
                    disabled={saving}
                    onConfirm={() => remove(h.id)}
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
