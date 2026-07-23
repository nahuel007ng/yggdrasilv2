export type SpriteEntry = {
  src: string;
  fallback: string;
};

export const avatarVideoMap: Record<string, string> = {
  'avatar-tier-1': '/sprites/avatars/avatar-1-durmiente.mp4',
  'avatar-tier-2': '/sprites/avatars/avatar-2-despertado.mp4',
  'avatar-tier-3': '/sprites/avatars/avatar-3-maestro.mp4',
  'avatar-tier-4': '/sprites/avatars/avatar-4-santo.mp4',
  'avatar-tier-5': '/sprites/avatars/avatar-5-soberano.mp4',
  'avatar-tier-6': '/sprites/avatars/avatar-6-angel.mp4',
  'avatar-tier-7': '/sprites/avatars/avatar-7-dios.mp4',
};

export const AVATAR_FRAME_SRC = '/sprites/avatars/recuadro_avatar.png';

export const avatarFallbackMap: Record<string, string> = {
  'avatar-tier-1': '🔰',
  'avatar-tier-2': '🗡️',
  'avatar-tier-3': '🛡️',
  'avatar-tier-4': '👑',
  'avatar-tier-5': '🐉',
  'avatar-tier-6': '👼',
  'avatar-tier-7': '✨',
};

export const spriteMap: Record<string, SpriteEntry> = {
  'badge-first-expense': { src: '/sprites/badges/badge-first-expense.png', fallback: '💰' },
  'badge-first-habit': { src: '/sprites/badges/badge-first-habit.png', fallback: '🔥' },
  'badge-first-task': { src: '/sprites/badges/badge-first-task.png', fallback: '✅' },
  'badge-first-study': { src: '/sprites/badges/badge-first-study.png', fallback: '📚' },
  'badge-first-workout': { src: '/sprites/badges/badge-first-workout.png', fallback: '💪' },
  'badge-streak-7': { src: '/sprites/badges/badge-streak-7.png', fallback: '🔥' },
  'badge-streak-30': { src: '/sprites/badges/badge-streak-30.png', fallback: '🌟' },
  'badge-perfect-week': { src: '/sprites/badges/badge-perfect-week.png', fallback: '⭐' },
  'badge-rank-despertado': { src: '/sprites/badges/badge-rank-despertado.png', fallback: '🏅' },
  'badge-rank-maestro': { src: '/sprites/badges/badge-rank-maestro.png', fallback: '🏅' },
  'badge-rank-santo': { src: '/sprites/badges/badge-rank-santo.png', fallback: '🏅' },
  'badge-rank-soberano': { src: '/sprites/badges/badge-rank-soberano.png', fallback: '🏅' },
  'badge-rank-espiritu': { src: '/sprites/badges/badge-rank-espiritu.png', fallback: '🏅' },
  'badge-rank-dios': { src: '/sprites/badges/badge-rank-dios.png', fallback: '🏅' },
  'badge-xp-1000': { src: '/sprites/badges/badge-xp-1000.png', fallback: '💎' },
  'badge-study-10h': { src: '/sprites/badges/badge-study-10h.png', fallback: '🎓' },
  'badge-workout-30': { src: '/sprites/badges/badge-workout-30.png', fallback: '🏋️' },
  'badge-all-rounder': { src: '/sprites/badges/badge-all-rounder.png', fallback: '🌈' },
  'badge-study-50h': { src: '/sprites/badges/badge-study-50h.png', fallback: '🏅' },
  'badge-study-100h': { src: '/sprites/badges/badge-study-100h.png', fallback: '🏅' },
  'badge-study-250h': { src: '/sprites/badges/badge-study-250h.png', fallback: '🏅' },
  'badge-study-500h': { src: '/sprites/badges/badge-study-500h.png', fallback: '🏅' },
  'badge-workout-60': { src: '/sprites/badges/badge-workout-60.png', fallback: '🏅' },
  'badge-workout-90': { src: '/sprites/badges/badge-workout-90.png', fallback: '🏅' },
  'badge-workout-120': { src: '/sprites/badges/badge-workout-120.png', fallback: '🏅' },
  'badge-workout-150': { src: '/sprites/badges/badge-workout-150.png', fallback: '🏅' },
  'badge-workout-200': { src: '/sprites/badges/badge-workout-200.png', fallback: '🏅' },
  'badge-workout-300': { src: '/sprites/badges/badge-workout-300.png', fallback: '🏅' },
  'badge-workout-500': { src: '/sprites/badges/badge-workout-500.png', fallback: '🏅' },
  'badge-savings-10k': { src: '/sprites/badges/badge-savings-10k.png', fallback: '🏅' },
  'badge-savings-100k': { src: '/sprites/badges/badge-savings-100k.png', fallback: '🏅' },
  'badge-savings-500k': { src: '/sprites/badges/badge-savings-500k.png', fallback: '🏅' },
  'badge-savings-1m': { src: '/sprites/badges/badge-savings-1m.png', fallback: '🏅' },
  'badge-read-50h': { src: '/sprites/badges/badge-read-50h.png', fallback: '🏅' },
  'badge-read-100h': { src: '/sprites/badges/badge-read-100h.png', fallback: '🏅' },
  'badge-read-250h': { src: '/sprites/badges/badge-read-250h.png', fallback: '🏅' },
  'badge-read-500h': { src: '/sprites/badges/badge-read-500h.png', fallback: '🏅' },
  'badge-books-classics-5': { src: '/sprites/badges/badge-books-classics-5.png', fallback: '🏅' },
  'badge-books-philosophy-10': { src: '/sprites/badges/badge-books-philosophy-10.png', fallback: '🏅' },
  'badge-books-science-5': { src: '/sprites/badges/badge-books-science-5.png', fallback: '🏅' },
  'badge-tasks-10': { src: '/sprites/badges/badge-tasks-10.png', fallback: '🏅' },
  'badge-tasks-50': { src: '/sprites/badges/badge-tasks-50.png', fallback: '🏅' },
  'badge-tasks-100': { src: '/sprites/badges/badge-tasks-100.png', fallback: '🏅' },
  'badge-tasks-zero-overdue': { src: '/sprites/badges/badge-tasks-zero-overdue.png', fallback: '🏅' },
  'title-sabio-formacion': { src: '/sprites/titles/title-sabio-formacion.png', fallback: '🏅' },
  'title-forjador-hierro': { src: '/sprites/titles/title-forjador-hierro.png', fallback: '🏅' },
  'title-tesorero-novato': { src: '/sprites/titles/title-tesorero-novato.png', fallback: '🏅' },
  'title-bibliotecario-junior': { src: '/sprites/titles/title-bibliotecario-junior.png', fallback: '🏅' },
  'title-estratega-ascenso': { src: '/sprites/titles/title-estratega-ascenso.png', fallback: '🏅' },
  'title-heroe-constancia': { src: '/sprites/titles/title-heroe-constancia.png', fallback: '🏅' },
  'title-forjador-voluntad': { src: '/sprites/titles/title-forjador-voluntad.png', fallback: '🏅' },
  'title-todoterreno-epico': { src: '/sprites/titles/title-todoterreno-epico.png', fallback: '🏅' },
  'title-sabio-integral': { src: '/sprites/titles/title-sabio-integral.png', fallback: '🏅' },
  'title-dios-sistema': { src: '/sprites/titles/title-dios-sistema.png', fallback: '🏅' },
  'title-cuerpo-dao-innato': { src: '/sprites/titles/title-cuerpo-dao-innato.png', fallback: '🏅' },
  'title-sentido-divino': { src: '/sprites/titles/title-sentido-divino.png', fallback: '🏅' },
  'title-cuerpo-dorado': { src: '/sprites/titles/title-cuerpo-dorado.png', fallback: '🏅' },
  'title-linaje-rey-dragon': { src: '/sprites/titles/title-linaje-rey-dragon.png', fallback: '🏅' },
  'misc-lock': { src: '/sprites/misc/lock.png', fallback: '🔒' },

  'nav-dashboard': { src: '/sprites/nav/nav-dashboard.png', fallback: '⚔️' },
  'nav-habitos': { src: '/sprites/nav/nav-habitos.png', fallback: '🔥' },
  'nav-finanzas': { src: '/sprites/nav/nav-finanzas.png', fallback: '💰' },
  'nav-tareas': { src: '/sprites/nav/nav-tareas.png', fallback: '📋' },
  'nav-estudios': { src: '/sprites/nav/nav-estudios.png', fallback: '📚' },
  'nav-entrenamientos': { src: '/sprites/nav/nav-entrenamientos.png', fallback: '💪' },
  'nav-perfil': { src: '/sprites/nav/nav-perfil.png', fallback: '🛡️' },
  'nav-calendario': { src: '/sprites/nav/nav-calendario.png', fallback: '📅' },
  'nav-biblioteca': { src: '/sprites/nav/nav-biblioteca.png', fallback: '📚' },
  'nav-config': { src: '/sprites/nav/nav-config.png', fallback: '⚙️' },
  'nav-logout': { src: '/sprites/nav/nav-logout.png', fallback: '🚪' },

  'streak-fire': { src: '/sprites/streaks/streak-fire.png', fallback: '🔥' },
  'shield': { src: '/sprites/streaks/shield.png', fallback: '🛡️' },

  'cat-comida': { src: '/sprites/categories/cat-comida.png', fallback: '🍎' },
  'cat-transporte': { src: '/sprites/categories/cat-transporte.png', fallback: '🚗' },
  'cat-entretenimiento': { src: '/sprites/categories/cat-entretenimiento.png', fallback: '🎲' },
  'cat-servicios': { src: '/sprites/categories/cat-servicios.png', fallback: '⚙️' },
  'cat-alquiler': { src: '/sprites/categories/cat-alquiler.png', fallback: '🏠' },
  'cat-salud': { src: '/sprites/categories/cat-salud.png', fallback: '❤️' },
  'cat-ropa': { src: '/sprites/categories/cat-ropa.png', fallback: '👕' },
  'cat-tecnologia': { src: '/sprites/categories/cat-tecnologia.png', fallback: '💎' },
  'cat-educacion': { src: '/sprites/categories/cat-educacion.png', fallback: '📖' },
  'cat-otros-gasto': { src: '/sprites/categories/cat-otros-gasto.png', fallback: '📦' },
  'cat-sueldo-cpcec': { src: '/sprites/categories/cat-sueldo-cpcec.png', fallback: '💰' },
  'cat-sueldo-nodo': { src: '/sprites/categories/cat-sueldo-nodo.png', fallback: '💎' },
  'cat-otros-ingreso': { src: '/sprites/categories/cat-otros-ingreso.png', fallback: '📦' },

  'status-complete': { src: '/sprites/status/status-complete.png', fallback: '✅' },
  'status-failed': { src: '/sprites/status/status-failed.png', fallback: '❌' },
  'status-pending': { src: '/sprites/status/status-pending.png', fallback: '⬜' },

  'priority-urgent-important': { src: '/sprites/priorities/priority-urgent-important.png', fallback: '🔴' },
  'priority-urgent-not-important': { src: '/sprites/priorities/priority-urgent-not-important.png', fallback: '🟡' },
  'priority-not-urgent-important': { src: '/sprites/priorities/priority-not-urgent-important.png', fallback: '🟠' },
  'priority-not-urgent-not-important': { src: '/sprites/priorities/priority-not-urgent-not-important.png', fallback: '⚪' },

  'stat-hours': { src: '/sprites/stats/stat-hours.png', fallback: '📖' },
  'stat-sessions': { src: '/sprites/stats/stat-sessions.png', fallback: '📝' },
  'stat-top': { src: '/sprites/stats/stat-top.png', fallback: '🏆' },
  'stat-average': { src: '/sprites/stats/stat-average.png', fallback: '📊' },

  'pr-trophy': { src: '/sprites/stats/pr-trophy.png', fallback: '🏆' },

  'celebration': { src: '/sprites/misc/celebration.png', fallback: '🎉' },
  'arrow-left': { src: '/sprites/misc/arrow-left.png', fallback: '◀' },
  'arrow-right': { src: '/sprites/misc/arrow-right.png', fallback: '▶' },
};

export function badgeToSpriteKey(badgeCode: string): string {
  return `badge-${badgeCode.replace(/_/g, '-')}`;
}

export function avatarTierToSpriteKey(avatarLevel: number): string {
  const tier = avatarLevel <= 4 ? 1
    : avatarLevel <= 14 ? 2
    : avatarLevel <= 29 ? 3
    : avatarLevel <= 49 ? 4
    : avatarLevel <= 74 ? 5
    : avatarLevel <= 99 ? 6
    : 7;
  return `avatar-tier-${tier}`;
}

export const RANK_NAMES: Record<number, string> = {
  1: 'Durmiente',
  2: 'Despertado',
  3: 'Maestro',
  4: 'Santo',
  5: 'Soberano',
  6: 'Espíritu',
  7: 'Dios',
};

export function getRankName(avatarLevel: number): string {
  const tier = avatarLevel <= 4 ? 1
    : avatarLevel <= 14 ? 2
    : avatarLevel <= 29 ? 3
    : avatarLevel <= 49 ? 4
    : avatarLevel <= 74 ? 5
    : avatarLevel <= 99 ? 6
    : 7;
  return RANK_NAMES[tier];
}