"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { configApi, type ConfigTag } from "@/lib/configApi";
import { ErrorBox, DeleteButton } from "@/components/config/ui";
import StarRating from "@/components/StarRating";

type BookTag = { id: string; name: string; color: string | null };

type Book = {
  id: string;
  title: string;
  author: string | null;
  status: string;
  rating: number | null;
  tags: BookTag[];
  created_at: string;
};

const STATUS: { value: string; label: string; color: string }[] = [
  { value: "pendiente", label: "Pendiente", color: "#8f97b8" },
  { value: "en_curso", label: "En curso", color: "#2dd4bf" },
  { value: "leido", label: "Leído", color: "#ffd23f" },
  { value: "abandonado", label: "Abandonado", color: "#f2617a" },
];

const statusMeta = (value: string) =>
  STATUS.find((s) => s.value === value) ?? { value, label: value, color: "#8f97b8" };

type FormDraft = {
  title: string;
  author: string;
  status: string;
  rating: number;
  tagIds: string[];
};

const EMPTY_DRAFT: FormDraft = {
  title: "",
  author: "",
  status: "pendiente",
  rating: 0,
  tagIds: [],
};

export default function BibliotecaPage() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [tags, setTags] = useState<ConfigTag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<FormDraft>(EMPTY_DRAFT);
  const [newTagName, setNewTagName] = useState("");

  const loadBooks = useCallback(() => {
    configApi<Book[]>("/api/biblioteca/books")
      .then(setBooks)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const loadTags = useCallback(() => {
    configApi<ConfigTag[]>("/api/biblioteca/tags")
      .then(setTags)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    loadBooks();
    loadTags();
  }, [loadBooks, loadTags]);

  const run = async (fn: () => Promise<unknown>) => {
    setSaving(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setEditId(null);
    setDraft(EMPTY_DRAFT);
    setNewTagName("");
    setFormOpen(true);
  };

  const openEdit = (b: Book) => {
    setEditId(b.id);
    setDraft({
      title: b.title,
      author: b.author ?? "",
      status: b.status,
      rating: b.rating ?? 0,
      tagIds: b.tags.map((t) => t.id),
    });
    setNewTagName("");
    setFormOpen(true);
  };

  const toggleTag = (id: string) =>
    setDraft((d) => ({
      ...d,
      tagIds: d.tagIds.includes(id)
        ? d.tagIds.filter((t) => t !== id)
        : [...d.tagIds, id],
    }));

  const createTag = () =>
    run(async () => {
      const name = newTagName.trim();
      if (!name) return;
      const tag = await configApi<ConfigTag>("/api/biblioteca/tags", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setNewTagName("");
      // upsert por (user_id, name): si ya existía devuelve la misma; evitar duplicado en el catálogo
      setTags((prev) =>
        prev.some((t) => t.id === tag.id) ? prev : [...prev, tag].sort((a, b) => a.name.localeCompare(b.name))
      );
      setDraft((d) =>
        d.tagIds.includes(tag.id) ? d : { ...d, tagIds: [...d.tagIds, tag.id] }
      );
    });

  const saveForm = () =>
    run(async () => {
      const payload = {
        title: draft.title.trim(),
        author: draft.author.trim() || null,
        status: draft.status,
        rating: draft.rating > 0 ? draft.rating : null,
      };
      let bookId = editId;
      if (editId) {
        await configApi(`/api/biblioteca/books/${editId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        const created = await configApi<Book>("/api/biblioteca/books", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        bookId = created.id;
      }
      if (bookId) {
        await configApi(`/api/biblioteca/books/${bookId}/tags`, {
          method: "PUT",
          body: JSON.stringify({ tag_ids: draft.tagIds }),
        });
      }
      setFormOpen(false);
      loadBooks();
    });

  const removeBook = (id: string) =>
    run(async () => {
      await configApi(`/api/biblioteca/books/${id}`, { method: "DELETE" });
      loadBooks();
    });

  const updateRating = (b: Book, rating: number) =>
    run(async () => {
      await configApi(`/api/biblioteca/books/${b.id}`, {
        method: "PATCH",
        body: JSON.stringify({ rating: rating > 0 ? rating : null }),
      });
      setBooks((prev) =>
        prev
          ? prev.map((x) => (x.id === b.id ? { ...x, rating: rating > 0 ? rating : null } : x))
          : prev
      );
    }).catch(() => loadBooks());

  const canSave = draft.title.trim().length > 0 && !saving;
  const availableTags = useMemo(
    () => [...tags].sort((a, b) => a.name.localeCompare(b.name)),
    [tags]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="section-title glow-text">Biblioteca</h1>
        <button type="button" className="pixel-btn pixel-btn-primary" onClick={openCreate}>
          + Agregar libro
        </button>
      </div>

      {error && <ErrorBox message={error} />}

      <div className="pixel-card" style={{ overflowX: "auto" }}>
        {books === null ? (
          <p className="text-muted">Cargando...</p>
        ) : books.length === 0 ? (
          <p className="text-muted">Todavía no hay libros. Agregá el primero.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--color-text-muted)" }}>
                <th style={{ padding: "8px 10px" }}>Nombre</th>
                <th style={{ padding: "8px 10px" }}>Autor</th>
                <th style={{ padding: "8px 10px" }}>Etiquetas</th>
                <th style={{ padding: "8px 10px" }}>Estado</th>
                <th style={{ padding: "8px 10px" }}>Calificación</th>
                <th style={{ padding: "8px 10px" }} />
              </tr>
            </thead>
            <tbody>
              {books.map((b) => {
                const sm = statusMeta(b.status);
                return (
                  <tr
                    key={b.id}
                    style={{ borderTop: "1px solid var(--color-border)" }}
                  >
                    <td style={{ padding: "10px", fontWeight: 600 }}>{b.title}</td>
                    <td style={{ padding: "10px", color: "var(--color-text-muted)" }}>
                      {b.author || "—"}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span className="flex flex-wrap gap-1">
                        {b.tags.length === 0 ? (
                          <span className="text-muted">—</span>
                        ) : (
                          b.tags.map((t) => <TagChip key={t.id} tag={t} />)
                        )}
                      </span>
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span
                        style={{
                          fontSize: 12,
                          padding: "2px 8px",
                          borderRadius: 4,
                          color: sm.color,
                          boxShadow: `0 0 0 1px ${sm.color}`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {sm.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px" }}>
                      <StarRating
                        value={b.rating}
                        onChange={(v) => updateRating(b, v)}
                        size={20}
                      />
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span className="flex gap-2 justify-end">
                        <button
                          type="button"
                          className="pixel-btn"
                          disabled={saving}
                          onClick={() => openEdit(b)}
                        >
                          Editar
                        </button>
                        <DeleteButton disabled={saving} onConfirm={() => removeBook(b.id)} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", overflowY: "auto" }}
          onClick={() => !saving && setFormOpen(false)}
        >
          <div
            className="pixel-card"
            style={{ width: "100%", maxWidth: 520, marginTop: 40 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="pixel-card-title">{editId ? "Editar libro" : "Agregar libro"}</h3>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Nombre
                <input
                  className="pixel-input"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="1984"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                Autor
                <input
                  className="pixel-input"
                  value={draft.author}
                  onChange={(e) => setDraft({ ...draft, author: e.target.value })}
                  placeholder="George Orwell"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                Estado
                <select
                  className="pixel-input"
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                >
                  {STATUS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-1 text-sm">
                <span>Calificación</span>
                <StarRating
                  value={draft.rating}
                  onChange={(v) => setDraft({ ...draft, rating: v })}
                  size={26}
                />
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <span>Etiquetas</span>
                <div className="flex flex-wrap gap-2">
                  {availableTags.length === 0 && (
                    <span className="text-muted">No hay etiquetas todavía.</span>
                  )}
                  {availableTags.map((t) => {
                    const on = draft.tagIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTag(t.id)}
                        style={{
                          fontSize: 12,
                          padding: "3px 10px",
                          borderRadius: 4,
                          cursor: "pointer",
                          color: on ? "#0d1020" : t.color || "var(--color-text)",
                          background: on ? t.color || "var(--color-purple)" : "transparent",
                          boxShadow: `0 0 0 1px ${t.color || "var(--color-border)"}`,
                        }}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-1">
                  <input
                    className="pixel-input"
                    style={{ flex: 1 }}
                    placeholder="Crear etiqueta nueva"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        createTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="pixel-btn"
                    disabled={saving || !newTagName.trim()}
                    onClick={createTag}
                  >
                    Crear
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="pixel-btn"
                disabled={saving}
                onClick={() => setFormOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="pixel-btn pixel-btn-primary"
                disabled={!canSave}
                onClick={saveForm}
              >
                {editId ? "Guardar" : "Agregar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TagChip({ tag }: { tag: BookTag }) {
  return (
    <span
      style={{
        fontSize: 12,
        padding: "2px 8px",
        borderRadius: 4,
        color: tag.color || "var(--color-text)",
        boxShadow: `0 0 0 1px ${tag.color || "var(--color-border)"}`,
        whiteSpace: "nowrap",
      }}
    >
      {tag.name}
    </span>
  );
}
