"use client";

import { useCallback, useEffect, useState } from "react";
import { configApi, type XpConfigRow } from "@/lib/configApi";
import { ErrorBox } from "@/components/config/ui";

type XpDraft = { xp_per_unit: string; unit_size: string; cap_units: string };

function toDraft(r: XpConfigRow): XpDraft {
  return {
    xp_per_unit: String(r.xp_per_unit ?? ""),
    unit_size: r.unit_size == null ? "" : String(r.unit_size),
    cap_units: r.cap_units == null ? "" : String(r.cap_units),
  };
}

export default function XpSection() {
  const [rows, setRows] = useState<XpConfigRow[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, XpDraft>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(() => {
    configApi<XpConfigRow[]>("/api/config/xp")
      .then((data) => {
        setRows(data);
        setDrafts(
          Object.fromEntries(data.map((r) => [r.action_type, toDraft(r)]))
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (actionType: string) => {
    const d = drafts[actionType];
    if (!d || d.xp_per_unit.trim() === "") return;
    setSaving(actionType);
    setError(null);
    try {
      await configApi(`/api/config/xp/${actionType}`, {
        method: "PATCH",
        body: JSON.stringify({
          xp_per_unit: Number(d.xp_per_unit),
          unit_size: d.unit_size.trim() === "" ? null : Number(d.unit_size),
          cap_units: d.cap_units.trim() === "" ? null : Number(d.cap_units),
        }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(null);
    }
  };

  const setDraft = (actionType: string, patch: Partial<XpDraft>) =>
    setDrafts((curr) => ({
      ...curr,
      [actionType]: { ...curr[actionType], ...patch },
    }));

  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title">Valores de XP</h3>
      {error && <ErrorBox message={error} />}

      <p className="text-muted text-xs mb-3">
        Lectura y estudio escalan por duración: XP = round(xp_per_unit ×
        min(minutos / unit_size, cap_units)). Las acciones sin unit_size dan XP
        fijo.
      </p>

      {rows === null ? (
        <p className="text-muted">Cargando...</p>
      ) : (
        <ul className="flex flex-col">
          {rows.map((r) => {
            const d = drafts[r.action_type];
            if (!d) return null;
            return (
              <li
                key={r.action_type}
                className="flex flex-wrap items-center gap-2 py-2"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <span
                  className="text-xs"
                  style={{ minWidth: 190, fontFamily: "var(--font-mono)" }}
                >
                  {r.action_type}
                </span>
                <label className="text-muted text-xs flex items-center gap-1">
                  XP
                  <input
                    className="pixel-input"
                    style={{ width: 70 }}
                    type="number"
                    min={0}
                    value={d.xp_per_unit}
                    onChange={(e) =>
                      setDraft(r.action_type, { xp_per_unit: e.target.value })
                    }
                  />
                </label>
                <label className="text-muted text-xs flex items-center gap-1">
                  cada
                  <input
                    className="pixel-input"
                    style={{ width: 70 }}
                    type="number"
                    min={0}
                    placeholder="—"
                    value={d.unit_size}
                    onChange={(e) =>
                      setDraft(r.action_type, { unit_size: e.target.value })
                    }
                  />
                  {r.unit_label ?? "u"}
                </label>
                <label className="text-muted text-xs flex items-center gap-1">
                  tope
                  <input
                    className="pixel-input"
                    style={{ width: 70 }}
                    type="number"
                    min={0}
                    placeholder="—"
                    value={d.cap_units}
                    onChange={(e) =>
                      setDraft(r.action_type, { cap_units: e.target.value })
                    }
                  />
                  u
                </label>
                <button
                  type="button"
                  className="pixel-btn pixel-btn-primary"
                  disabled={saving !== null || d.xp_per_unit.trim() === ""}
                  onClick={() => save(r.action_type)}
                >
                  {saving === r.action_type ? "..." : "Guardar"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
