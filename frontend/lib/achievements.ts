// Catálogo de logros y títulos — Gamificación V2.2
// Fuente única del frontend. Debe coincidir con backend/app/services/badges.py y titles.py.

export type RouteKey =
  | "erudito" | "guerrero" | "tesorero" | "bibliotecario" | "estratega" | "sistema";

export type StatKey = "STR" | "AGI" | "VIT" | "WIL" | "INT";
export type StatBonuses = Partial<Record<StatKey, number>>;
export type TitleRarity = "comun" | "epico" | "mitico" | "legendario";

export interface AchievementDef {
  code: string;
  name: string;
  route: RouteKey;
  tier: number;
  description: string;
  statBonuses: StatBonuses;
}

export interface TitleDef {
  code: string;
  name: string;
  rarity: TitleRarity;
  requirement: string;
  statBonuses: StatBonuses;
}

export const ROUTE_INFO: Record<RouteKey, { name: string; icon: string }> = {
  erudito: { name: "Ruta del Erudito", icon: "📚" },
  guerrero: { name: "Ruta del Guerrero", icon: "🏋️" },
  tesorero: { name: "Ruta del Tesorero", icon: "💰" },
  bibliotecario: { name: "Ruta del Bibliotecario", icon: "📖" },
  estratega: { name: "Ruta del Estratega", icon: "🗡️" },
  sistema: { name: "Ruta del Sistema", icon: "⚙️" },
};

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Erudito (INT/WIL) ──
  { code: "first_study", name: "Primera sesión", route: "erudito", tier: 1, description: "Registrá tu primera sesión de estudio", statBonuses: { INT: 2 } },
  { code: "study_10h", name: "Diez horas de estudio", route: "erudito", tier: 2, description: "Acumulá 10 horas de estudio", statBonuses: { INT: 4, WIL: 2 } },
  { code: "study_50h", name: "Aprendiz", route: "erudito", tier: 3, description: "Acumulá 50 horas de estudio", statBonuses: { INT: 6, WIL: 3 } },
  { code: "study_100h", name: "Forjador de Alma", route: "erudito", tier: 4, description: "Acumulá 100 horas de estudio", statBonuses: { INT: 10, WIL: 5 } },
  { code: "study_250h", name: "Sabio en Ciernes", route: "erudito", tier: 5, description: "Acumulá 250 horas de estudio", statBonuses: { INT: 16, WIL: 8 } },
  { code: "study_500h", name: "Erudito Consagrado", route: "erudito", tier: 6, description: "Acumulá 500 horas de estudio", statBonuses: { INT: 24, WIL: 12 } },
  // ── Guerrero (STR/VIT/AGI; rachas → WIL) ──
  { code: "first_habit", name: "Primer hábito", route: "guerrero", tier: 1, description: "Completá tu primer hábito", statBonuses: { VIT: 2 } },
  { code: "first_workout", name: "Primer entrenamiento", route: "guerrero", tier: 1, description: "Registrá tu primer entrenamiento", statBonuses: { STR: 2, VIT: 2 } },
  { code: "streak_7", name: "Racha de 7", route: "guerrero", tier: 2, description: "Mantené una racha de 7 días", statBonuses: { WIL: 4 } },
  { code: "perfect_week", name: "Semana perfecta", route: "guerrero", tier: 3, description: "Completá todos los hábitos 7 días seguidos", statBonuses: { WIL: 6 } },
  { code: "streak_30", name: "Racha de 30", route: "guerrero", tier: 4, description: "Mantené una racha de 30 días", statBonuses: { WIL: 10 } },
  { code: "workout_30", name: "Forja de Huesos 1", route: "guerrero", tier: 2, description: "30 entrenamientos", statBonuses: { STR: 4, VIT: 4, AGI: 2 } },
  { code: "workout_60", name: "Forja de Huesos 2", route: "guerrero", tier: 3, description: "60 entrenamientos", statBonuses: { STR: 6, VIT: 5, AGI: 3 } },
  { code: "workout_90", name: "Forja de Huesos 3", route: "guerrero", tier: 4, description: "90 entrenamientos", statBonuses: { STR: 8, VIT: 6, AGI: 4 } },
  { code: "workout_120", name: "Limpieza de Médula 1", route: "guerrero", tier: 5, description: "120 entrenamientos", statBonuses: { STR: 10, VIT: 8, AGI: 5 } },
  { code: "workout_150", name: "Limpieza de Médula 2", route: "guerrero", tier: 6, description: "150 entrenamientos", statBonuses: { STR: 12, VIT: 10, AGI: 6 } },
  { code: "workout_200", name: "Limpieza de Médula 3", route: "guerrero", tier: 7, description: "200 entrenamientos", statBonuses: { STR: 14, VIT: 12, AGI: 7 } },
  { code: "workout_300", name: "Médula Forjada", route: "guerrero", tier: 8, description: "300 entrenamientos", statBonuses: { STR: 18, VIT: 15, AGI: 9 } },
  { code: "workout_500", name: "Cuerpo Dorado Primordial", route: "guerrero", tier: 9, description: "500 entrenamientos", statBonuses: { STR: 25, VIT: 20, AGI: 12 } },
  // ── Tesorero (WIL/INT) ──
  { code: "first_expense", name: "Primer gasto", route: "tesorero", tier: 1, description: "Registrá tu primera transacción", statBonuses: { WIL: 2 } },
  { code: "savings_10k", name: "Monje Mendigo", route: "tesorero", tier: 2, description: "Ahorrá $10.000", statBonuses: { WIL: 4, INT: 2 } },
  { code: "savings_100k", name: "Comerciante Ambulante", route: "tesorero", tier: 3, description: "Ahorrá $100.000", statBonuses: { WIL: 8, INT: 3 } },
  { code: "savings_500k", name: "Tesorero de la Secta", route: "tesorero", tier: 4, description: "Ahorrá $500.000", statBonuses: { WIL: 14, INT: 5 } },
  { code: "savings_1m", name: "Rico McPato", route: "tesorero", tier: 5, description: "Ahorrá $1.000.000", statBonuses: { WIL: 22, INT: 8 } },
  // ── Bibliotecario (INT/WIL) ──
  { code: "read_50h", name: "Lector Iniciante", route: "bibliotecario", tier: 1, description: "Acumulá 50 horas de lectura", statBonuses: { INT: 6, WIL: 3 } },
  { code: "read_100h", name: "Lector Amateur", route: "bibliotecario", tier: 2, description: "Acumulá 100 horas de lectura", statBonuses: { INT: 10, WIL: 5 } },
  { code: "read_250h", name: "Lector Ávido", route: "bibliotecario", tier: 3, description: "Acumulá 250 horas de lectura", statBonuses: { INT: 16, WIL: 8 } },
  { code: "read_500h", name: "Lector Omnisciente", route: "bibliotecario", tier: 4, description: "Acumulá 500 horas de lectura", statBonuses: { INT: 24, WIL: 12 } },
  { code: "books_classics_5", name: "¿Ser o no ser?", route: "bibliotecario", tier: 2, description: "Terminá 5 clásicos literarios", statBonuses: { INT: 8, WIL: 4 } },
  { code: "books_philosophy_10", name: "El mundo de Nahuel", route: "bibliotecario", tier: 3, description: "Terminá 10 obras filosóficas", statBonuses: { INT: 12, WIL: 6 } },
  { code: "books_science_5", name: "Mente Científica", route: "bibliotecario", tier: 2, description: "Terminá 5 obras de divulgación científica", statBonuses: { INT: 8, WIL: 4 } },
  // ── Estratega (AGI/INT) ──
  { code: "first_task", name: "Primera tarea", route: "estratega", tier: 1, description: "Creá tu primera tarea", statBonuses: { AGI: 2 } },
  { code: "tasks_10", name: "Escudero Organizado", route: "estratega", tier: 2, description: "Completá 10 tareas", statBonuses: { AGI: 4, INT: 2 } },
  { code: "tasks_50", name: "Caballero de la Agenda", route: "estratega", tier: 3, description: "Completá 50 tareas", statBonuses: { AGI: 8, INT: 4 } },
  { code: "tasks_100", name: "Estratega de Guerra", route: "estratega", tier: 4, description: "Completá 100 tareas", statBonuses: { AGI: 14, INT: 6 } },
  { code: "tasks_zero_overdue", name: "Orden del Fénix", route: "estratega", tier: 3, description: "Terminá un día sin tareas vencidas", statBonuses: { AGI: 6, WIL: 6 } },
  // ── Sistema (todas las stats) ──
  { code: "xp_1000", name: "Mil puntos", route: "sistema", tier: 1, description: "Acumulá 1.000 XP", statBonuses: { STR: 3, AGI: 3, VIT: 3, WIL: 3, INT: 3 } },
  { code: "all_rounder", name: "Todoterreno", route: "sistema", tier: 1, description: "Al menos 1 registro en los 5 dominios", statBonuses: { STR: 4, AGI: 4, VIT: 4, WIL: 4, INT: 4 } },
  { code: "rank_despertado", name: "Despertado", route: "sistema", tier: 2, description: "Alcanzá el nivel 5", statBonuses: { STR: 5, AGI: 5, VIT: 5, WIL: 5, INT: 5 } },
  { code: "rank_maestro", name: "Maestro", route: "sistema", tier: 3, description: "Alcanzá el nivel 15", statBonuses: { STR: 8, AGI: 8, VIT: 8, WIL: 8, INT: 8 } },
  { code: "rank_santo", name: "Santo", route: "sistema", tier: 4, description: "Alcanzá el nivel 30", statBonuses: { STR: 12, AGI: 12, VIT: 12, WIL: 12, INT: 12 } },
  { code: "rank_soberano", name: "Soberano", route: "sistema", tier: 5, description: "Alcanzá el nivel 50", statBonuses: { STR: 16, AGI: 16, VIT: 16, WIL: 16, INT: 16 } },
  { code: "rank_espiritu", name: "Espíritu", route: "sistema", tier: 6, description: "Alcanzá el nivel 75", statBonuses: { STR: 22, AGI: 22, VIT: 22, WIL: 22, INT: 22 } },
  { code: "rank_dios", name: "Dios", route: "sistema", tier: 7, description: "Alcanzá el nivel 100", statBonuses: { STR: 30, AGI: 30, VIT: 30, WIL: 30, INT: 30 } },
];

export const TITLES: TitleDef[] = [
  { code: "title_sabio_formacion", name: "Sabio en Formación", rarity: "comun", requirement: "3 logros de la Ruta del Erudito", statBonuses: { INT: 5, WIL: 5 } },
  { code: "title_forjador_hierro", name: "Forjador de Hierro", rarity: "comun", requirement: "3 logros de la Ruta del Guerrero", statBonuses: { STR: 5, VIT: 5 } },
  { code: "title_tesorero_novato", name: "Tesorero Novato", rarity: "comun", requirement: "2 logros de la Ruta del Tesorero", statBonuses: { WIL: 5, INT: 5 } },
  { code: "title_bibliotecario_junior", name: "Bibliotecario Junior", rarity: "comun", requirement: "2 logros de la Ruta del Bibliotecario", statBonuses: { INT: 5, WIL: 5 } },
  { code: "title_estratega_ascenso", name: "Estratega en Ascenso", rarity: "comun", requirement: "2 logros de la Ruta del Estratega", statBonuses: { AGI: 5, INT: 5 } },
  { code: "title_heroe_constancia", name: "Héroe de la Constancia", rarity: "epico", requirement: "Racha de 30 + 100hs de estudio + Forja de Huesos 3", statBonuses: { WIL: 10, VIT: 10 } },
  { code: "title_forjador_voluntad", name: "Forjador de Voluntad", rarity: "epico", requirement: "Los 3 logros de rachas", statBonuses: { WIL: 15 } },
  { code: "title_todoterreno_epico", name: "Todoterreno Épico", rarity: "epico", requirement: "1 logro en cada una de las 5 rutas", statBonuses: { STR: 6, AGI: 6, VIT: 6, WIL: 6, INT: 6 } },
  { code: "title_sabio_integral", name: "Sabio Integral", rarity: "mitico", requirement: "3 logros en cada una de las 5 rutas", statBonuses: { STR: 12, AGI: 12, VIT: 12, WIL: 12, INT: 12 } },
  { code: "title_dios_sistema", name: "Dios del Sistema", rarity: "mitico", requirement: "Rango Soberano + 20 logros", statBonuses: { STR: 15, AGI: 15, VIT: 15, WIL: 15, INT: 15 } },
  { code: "title_cuerpo_dao_innato", name: "Cuerpo Dao Innato", rarity: "mitico", requirement: "TODOS los logros del Erudito", statBonuses: { INT: 25, WIL: 15 } },
  { code: "title_sentido_divino", name: "Apertura del Sentido Divino", rarity: "mitico", requirement: "TODOS los logros del Bibliotecario", statBonuses: { INT: 25, WIL: 15 } },
  { code: "title_cuerpo_dorado", name: "Cuerpo Dorado Primordial", rarity: "mitico", requirement: "500 entrenamientos", statBonuses: { STR: 25, VIT: 20, AGI: 10 } },
  { code: "title_linaje_rey_dragon", name: "Linaje del Rey Dragón Primordial", rarity: "legendario", requirement: "Los 3 Cuerpos Innatos", statBonuses: { STR: 40, AGI: 40, VIT: 40, WIL: 40, INT: 40 } },
];

// Helpers
export const ACHIEVEMENTS_BY_CODE = Object.fromEntries(ACHIEVEMENTS.map(a => [a.code, a])) as Record<string, AchievementDef>;
export const TITLES_BY_CODE = Object.fromEntries(TITLES.map(t => [t.code, t])) as Record<string, TitleDef>;
export function achievementsOfRoute(route: RouteKey): AchievementDef[] {
  return ACHIEVEMENTS.filter(a => a.route === route).sort((a, b) => a.tier - b.tier);
}
export function titleToSpriteKey(titleCode: string): string {
  return titleCode.replace(/_/g, "-");
}