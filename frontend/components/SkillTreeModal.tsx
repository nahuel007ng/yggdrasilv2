"use client";

import { useEffect } from "react";
import PixelIcon from "@/components/PixelIcon";
import { badgeToSpriteKey } from "@/lib/spriteMap";
import {
  ROUTE_INFO,
  ACHIEVEMENTS_BY_CODE,
  TITLES_BY_CODE,
  achievementsOfRoute,
  titleToSpriteKey,
  type RouteKey,
  type TitleDef,
} from "@/lib/achievements";

interface SkillTreeModalProps {
  onClose: () => void;
  unlockedBadges: Set<string>;
  unlockedTitles: Set<string>;
}

const GUERRERO_HABITOS = ["first_habit", "streak_7", "perfect_week", "streak_30"];
const GUERRERO_ENTRENO = ["first_workout", "workout_30", "workout_60", "workout_90", "workout_120", "workout_150", "workout_200", "workout_300", "workout_500"];

const ROUTE_TITLES: Record<string, string> = {
  erudito: "title_cuerpo_dao_innato",
  bibliotecario: "title_sentido_divino",
  guerrero: "title_cuerpo_dorado",
};

function TreeNode({ code, unlocked }: { code: string; unlocked: Set<string> }) {
  const def = ACHIEVEMENTS_BY_CODE[code];
  if (!def) return null;
  const isUnlocked = unlocked.has(code);
  return (
    <div
      className={`skill-node ${isUnlocked ? "skill-node--unlocked" : "skill-node--locked"}`}
      title={def.description}
    >
      <PixelIcon name={badgeToSpriteKey(code)} size={48} alt={def.name} />
      {!isUnlocked && (
        <span className="absolute top-0 right-1 text-[10px]">🔒</span>
      )}
      <span className="text-[10px] text-center leading-tight">{def.name}</span>
    </div>
  );
}

function Connector({ unlocked }: { unlocked: boolean }) {
  return <div className={`skill-connector ${unlocked ? "skill-connector--unlocked" : ""}`} />;
}

function ChainRow({ codes, unlocked }: { codes: string[]; unlocked: Set<string> }) {
  return (
    <div className="flex items-center overflow-x-auto pb-1">
      {codes.map((code, i) => (
        <div key={code} className="flex items-center shrink-0">
          <TreeNode code={code} unlocked={unlocked} />
          {i < codes.length - 1 && <Connector unlocked={unlocked.has(code) && unlocked.has(codes[i + 1])} />}
        </div>
      ))}
    </div>
  );
}

function TitleNode({ titleCode, unlocked }: { titleCode: string; unlocked: Set<string> }) {
  const def = TITLES_BY_CODE[titleCode];
  if (!def) return null;
  const isUnlocked = unlocked.has(titleCode);
  return (
    <div
      className={`skill-node ${isUnlocked ? "skill-node--unlocked" : "skill-node--locked"}`}
      title={def.requirement}
    >
      <PixelIcon name={titleToSpriteKey(titleCode)} size={48} alt={def.name} />
      {!isUnlocked && <span className="absolute top-0 right-1 text-[10px]">🔒</span>}
      <span className={`text-[10px] text-center leading-tight title-${def.rarity}`}>
        {def.name}
      </span>
    </div>
  );
}

function RouteSection({ route, unlockedBadges, unlockedTitles }: { route: RouteKey; unlockedBadges: Set<string>; unlockedTitles: Set<string> }) {
  const info = ROUTE_INFO[route];
  const titleCode = ROUTE_TITLES[route as string];
  const titleDef = titleCode ? TITLES_BY_CODE[titleCode] : null;

  if (route === "guerrero") {
    return (
      <div className="flex flex-col gap-2 py-2">
        <span className="text-pixel text-xs">{info.icon} {info.name.toUpperCase()}</span>
        <ChainRow codes={GUERRERO_HABITOS} unlocked={unlockedBadges} />
        <ChainRow codes={GUERRERO_ENTRENO} unlocked={unlockedBadges} />
        {titleDef && (
          <div className="flex flex-col items-center gap-1 ml-8">
            <div className={`skill-connector-v ${unlockedTitles.has(titleCode as string) ? "skill-connector-v--unlocked" : ""}`} />
            <TitleNode titleCode={titleCode as string} unlocked={unlockedTitles} />
          </div>
        )}
      </div>
    );
  }

  const codes = achievementsOfRoute(route).map((a) => a.code);
  return (
    <div className="flex flex-col gap-2 py-2">
      <span className="text-pixel text-xs">{info.icon} {info.name.toUpperCase()}</span>
      <ChainRow codes={codes} unlocked={unlockedBadges} />
      {titleDef && (
        <div className="flex flex-col items-center gap-1 ml-8">
          <div className={`skill-connector-v ${unlockedTitles.has(titleCode as string) ? "skill-connector-v--unlocked" : ""}`} />
          <TitleNode titleCode={titleCode as string} unlocked={unlockedTitles} />
        </div>
      )}
    </div>
  );
}

const ALL_ROUTE_KEYS: RouteKey[] = ["erudito", "guerrero", "tesorero", "bibliotecario", "estratega", "sistema"];

export default function SkillTreeModal({ onClose, unlockedBadges, unlockedTitles }: SkillTreeModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const badgeCount = unlockedBadges.size;
  const titleCount = unlockedTitles.size;
  const allTitles: TitleDef[] = Object.values(TITLES_BY_CODE);
  const linajeTitles = ["title_cuerpo_dao_innato", "title_sentido_divino", "title_cuerpo_dorado"];
  const linajeUnlocked = linajeTitles.every((t) => unlockedTitles.has(t));

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.6)" }}
      />
      <div
        className="flex flex-col"
        style={{
          position: "fixed",
          inset: "4px",
          zIndex: 100,
          background: "var(--color-bg-deep)",
          border: "3px solid var(--color-mana)",
          boxShadow: "0 0 16px rgba(74,158,142,.5)",
          maxHeight: "100dvh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{
            borderBottom: "2px solid var(--color-mana)",
            background: "var(--color-bg)",
          }}
        >
          <div className="flex flex-col">
            <span className="text-pixel text-xs" style={{ color: "var(--color-mana-light)" }}>
              SISTEMA — ÁRBOL DE SKILLS
            </span>
            <span className="text-muted text-[10px]">
              {badgeCount}/44 logros · {titleCount}/14 títulos
            </span>
          </div>
          <button
            type="button"
            className="pixel-btn"
            onClick={onClose}
            aria-label="Cerrar árbol"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ background: "var(--color-bg-deep)" }}>
          {ALL_ROUTE_KEYS.map((route) => (
            <div key={route} className="pixel-card">
              <RouteSection route={route} unlockedBadges={unlockedBadges} unlockedTitles={unlockedTitles} />
            </div>
          ))}

          {/* Títulos */}
          <div className="pixel-card">
            <span className="text-pixel text-xs block mb-2">🏆 TÍTULOS</span>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {allTitles.map((t) => {
                const isUnlocked = unlockedTitles.has(t.code);
                return (
                  <div
                    key={t.code}
                    className={`skill-node ${isUnlocked ? "skill-node--unlocked" : "skill-node--locked"}`}
                    title={t.requirement}
                  >
                    <PixelIcon name={titleToSpriteKey(t.code)} size={40} alt={t.name} />
                    {!isUnlocked && <span className="absolute top-0 right-1 text-[10px]">🔒</span>}
                    <span className={`text-[10px] text-center leading-tight title-${t.rarity}`}>
                      {t.name}
                    </span>
                    <span className="text-[9px] text-muted text-center leading-tight">
                      {t.requirement}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Linaje */}
          <div className="pixel-card">
            <span className="text-pixel text-xs block mb-2">⚫ LINAJE</span>
            <div className="flex items-center gap-3 flex-wrap">
              {linajeTitles.map((code) => (
                <div key={code}>
                  <TitleNode titleCode={code} unlocked={unlockedTitles} />
                </div>
              ))}
              <div className={`skill-connector-v ${linajeUnlocked ? "skill-connector-v--unlocked" : ""}`} />
              <TitleNode titleCode="title_linaje_rey_dragon" unlocked={unlockedTitles} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}