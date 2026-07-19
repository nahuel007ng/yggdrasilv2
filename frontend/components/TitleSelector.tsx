"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { TITLES_BY_CODE } from "@/lib/achievements";

interface TitleSelectorProps {
  unlockedTitles: { code: string }[];
  activeTitle: string | null;
  onChanged: () => void;
}

export default function TitleSelector({ unlockedTitles, activeTitle, onChanged }: TitleSelectorProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const activeDef = activeTitle ? TITLES_BY_CODE[activeTitle] : null;

  async function selectTitle(code: string | null) {
    setSaving(true);
    const { error } = await supabase
      .from("user_profile")
      .update({ active_title: code })
      .not("id", "is", null);
    setSaving(false);
    if (!error) {
      setOpen(false);
      onChanged();
    }
  }

  if (unlockedTitles.length === 0) {
    return (
      <div className="pixel-card">
        <h3 className="pixel-card-title">Título</h3>
        <p className="text-muted text-xs">
          Todavía no desbloqueaste títulos.
        </p>
      </div>
    );
  }

  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title">Título</h3>
      <div className="flex flex-col gap-2 py-1">
        {activeDef ? (
          <div
            className="p-2"
            style={{ boxShadow: "0 0 0 2px var(--color-gold), var(--glow-gold)" }}
          >
            <p className={`text-pixel text-xs title-${activeDef.rarity}`}>
              « {activeDef.name} »
            </p>
          </div>
        ) : (
          <p className="text-muted text-xs">Sin título equipado</p>
        )}
        <button
          type="button"
          className="pixel-btn self-start"
          onClick={() => setOpen((v) => !v)}
          disabled={saving}
        >
          {open ? "Cerrar" : "Cambiar título"}
        </button>
        {open && (
          <div className="flex flex-col gap-1 mt-1">
            <button
              type="button"
              className="pixel-btn text-left"
              onClick={() => selectTitle(null)}
              disabled={saving}
            >
              ✕ Sin título
            </button>
            {unlockedTitles.map((t) => {
              const def = TITLES_BY_CODE[t.code];
              if (!def) return null;
              return (
                <button
                  key={t.code}
                  type="button"
                  className={`pixel-btn text-left title-${def.rarity}`}
                  onClick={() => selectTitle(t.code)}
                  disabled={saving}
                >
                  {def.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}