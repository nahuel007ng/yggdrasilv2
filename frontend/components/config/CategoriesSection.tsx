"use client";

import { useCallback, useEffect, useState } from "react";
import { configApi, type ConfigCategory } from "@/lib/configApi";
import { ColorField, DeleteButton, ErrorBox } from "@/components/config/ui";

type Draft = { name: string; icon: string; color: string; type: string };

const EMPTY_DRAFT: Draft = { name: "", icon: "", color: "#8a93c2", type: "expense" };

function toDraft(c: ConfigCategory): Draft {
  return {
    name: c.name,
    icon: c.icon ?? "",
    color: c.color ?? "",
    type: c.type ?? "expense",
  };
}

export default function CategoriesSection() {
  const [items, setItems] = useState<ConfigCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY_DRAFT);

  const load = useCallback(() => {
    configApi<ConfigCategory[]>("/api/config/categories")
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
      await configApi("/api/config/categories", {
        method: "POST",
        body: JSON.stringify({
          name: draft.name.trim(),
          icon: draft.icon.trim() || null,
          color: draft.color.trim() || null,
          type: draft.type,
        }),
      });
      setDraft(EMPTY_DRAFT);
    });

  const saveEdit = (id: string) =>
    run(async () => {
      await configApi(`/api/config/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editDraft.name.trim(),
          icon: editDraft.icon.trim() || null,
          color: editDraft.color.trim() || null,
          type: editDraft.type,
        }),
      });
      setEditId(null);
    });

  const remove = (id: string) =>
    run(async () => {
      await configApi(`/api/config/categories/${id}`, { method: "DELETE" });
    });

  const typeSelect = (value: string, onChange: (v: string) => void) => (
    <select
      className="pixel-input"
      style={{ width: "auto" }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Tipo"
    >
      <option value="expense">Gasto</option>
      <option value="income">Ingreso</option>
    </select>
  );

  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title">Categorías de gastos</h3>
      {error && <ErrorBox message={error} />}

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
        {typeSelect(draft.type, (v) => setDraft({ ...draft, type: v }))}
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
        <p className="text-muted">No hay categorías</p>
      ) : (
        <ul className="flex flex-col">
          {items.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-2 py-2"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              {editId === c.id ? (
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
                  {typeSelect(editDraft.type, (v) =>
                    setEditDraft({ ...editDraft, type: v })
                  )}
                  <button
                    type="button"
                    className="pixel-btn pixel-btn-primary"
                    disabled={saving || !editDraft.name.trim()}
                    onClick={() => saveEdit(c.id)}
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
                  <span style={{ width: 24, textAlign: "center" }}>{c.icon}</span>
                  <span className="flex-1">{c.name}</span>
                  <span
                    aria-hidden
                    style={{
                      width: 16,
                      height: 16,
                      background: c.color || "transparent",
                      boxShadow: "0 0 0 1px var(--color-border)",
                    }}
                  />
                  <span className="text-muted text-xs">
                    {c.type === "income" ? "Ingreso" : "Gasto"}
                  </span>
                  <button
                    type="button"
                    className="pixel-btn"
                    disabled={saving}
                    onClick={() => {
                      setEditId(c.id);
                      setEditDraft(toDraft(c));
                    }}
                  >
                    Editar
                  </button>
                  <DeleteButton
                    disabled={saving}
                    onConfirm={() => remove(c.id)}
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
