// Espejo de los tokens de app/globals.css para consumo desde JS (Recharts, inline styles).
// REGLA: si cambia un token en globals.css, se actualiza acá. No usar hex sueltos en .tsx.

export const PALETTE = {
  bgDeep: "#0d1020",
  bg: "#151a30",
  bgSurface: "#1d2340",
  bgSurfaceHover: "#262d4d",
  border: "#39406b",
  borderLight: "#525c8f",
  mana: "#2dd4bf",
  manaLight: "#5eead4",
  coral: "#ff8a5c",
  coralLight: "#ffab85",
  gold: "#ffd23f",
  xp: "#a3e635",
  hp: "#ff5470",
  purple: "#a78bfa",
  warning: "#f0ad4e",
  text: "#e6eaf6",
  textMuted: "#8f97b8",
  textHeading: "#f5f7ff",
} as const;

// Paleta ordenada para gráficos (Recharts pie/legend).
export const CHART_COLORS: string[] = [
  PALETTE.coral,
  PALETTE.mana,
  PALETTE.gold,
  PALETTE.xp,
  PALETTE.hp,
  PALETTE.manaLight,
  PALETTE.coralLight,
  PALETTE.purple,
  "#38bdf8", // celeste auxiliar (sin token propio)
  "#94a3b8", // gris auxiliar (sin token propio)
];
