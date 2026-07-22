"use client";

import { useCallback, useEffect, useState } from "react";
import { configApi, type ConfigTag } from "@/lib/configApi";
import { ColorField, DeleteButton, ErrorBox } from "@/components/config/ui";

type Draft = { name: string; color: string };

const EMPTY_DRAFT: Draft = { name: "", color: "#8a93c2" };

export default function TagsSection() {
  const [items, setItems] = useState<ConfigTag[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY_DRAFT);

  const load = useCallback(() => {
    configApi<ConfigTag[]>("/api/config/tags")
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
      await configApi("/api/config/tags", {
        method: "POST",
        body: JSON.stringify({
          name: draft.name.trim(),
          color: draft.color.trim() || null,
        }),
      });
      setDraft(EMPTY_DRAFT);
    });

  const saveEdit = (id: string) =>
    run(async () => {
      await configApi(`/api/config/tags/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editDraft.name.trim(),
          color: editDraft.color.trim() || null,
        }),
      });
      setEditId(null);
    });

  const remove = (id: string) =>
    run(async () => {
      await configApi(`/api/config/tags/${id}`, { method: "DELETE" });
    });

  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title">Etiquetas de Biblioteca</h3>
      {error && <ErrorBox message={error} />}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          className="pixel-input"
          style={{ width: 180 }}
          placeholder="Nombre"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <ColorField
          value={draft.color}
          onChange={(v) => setDraft({ ...draft, color: v })}
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
        <p className="text-muted">No hay etiquetas</p>
      ) : (
        <ul className="flex flex-col">
          {items.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center gap-2 py-2"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              {editId === t.id ? (
                <>
                  <input
                    className="pixel-input"
                    style={{ width: 160 }}
                    value={editDraft.name}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, name: e.target.value })
                    }
                  />
                  <ColorField
                    value={editDraft.color}
                    onChange={(v) => setEditDraft({ ...editDraft, color: v })}
                  />
                  <button
                    type="button"
                    className="pixel-btn pixel-btn-primary"
                    disabled={saving || !editDraft.name.trim()}
                    onClick={() => saveEdit(t.id)}
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
                    aria-hidden
                    style={{
                      width: 16,
                      height: 16,
                      background: t.color || "transparent",
                      boxShadow: "0 0 0 1px var(--color-border)",
                    }}
                  />
                  <span className="flex-1">{t.name}</span>
                  <button
                    type="button"
                    className="pixel-btn"
                    disabled={saving}
                    onClick={() => {
                      setEditId(t.id);
                      setEditDraft({
                        name: t.name,
                        color: t.color ?? "",
                      });
                    }}
                  >
                    Editar
                  </button>
                  <DeleteButton
                    disabled={saving}
                    onConfirm={() => remove(t.id)}
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
