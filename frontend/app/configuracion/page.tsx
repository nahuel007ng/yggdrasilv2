"use client";

import { useState } from "react";
import CategoriesSection from "@/components/config/CategoriesSection";
import HabitsSection from "@/components/config/HabitsSection";
import XpSection from "@/components/config/XpSection";
import TagsSection from "@/components/config/TagsSection";

const SECTIONS = [
  { key: "categorias", label: "Categorías" },
  { key: "habitos", label: "Hábitos" },
  { key: "xp", label: "Valores de XP" },
  { key: "etiquetas", label: "Etiquetas" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

export default function ConfiguracionPage() {
  const [active, setActive] = useState<SectionKey>("categorias");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="section-title glow-text">Configuración</h1>

      <div className="flex gap-2 flex-wrap">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`pixel-btn ${active === s.key ? "pixel-btn-primary" : ""}`}
            onClick={() => setActive(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {active === "categorias" && <CategoriesSection />}
      {active === "habitos" && <HabitsSection />}
      {active === "xp" && <XpSection />}
      {active === "etiquetas" && <TagsSection />}
    </div>
  );
}
