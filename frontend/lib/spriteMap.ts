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
  'badge-level-5': { src: '/sprites/badges/badge-level-5.png', fallback: '🏅' },
  'badge-level-10': { src: '/sprites/badges/badge-level-10.png', fallback: '🏆' },
  'badge-level-25': { src: '/sprites/badges/badge-level-25.png', fallback: '👑' },
  'badge-xp-1000': { src: '/sprites/badges/badge-xp-1000.png', fallback: '💎' },
  'badge-study-10h': { src: '/sprites/badges/badge-study-10h.png', fallback: '🎓' },
  'badge-workout-30': { src: '/sprites/badges/badge-workout-30.png', fallback: '🏋️' },
  'badge-all-rounder': { src: '/sprites/badges/badge-all-rounder.png', fallback: '🌈' },

  'nav-dashboard': { src: '/sprites/nav/nav-dashboard.png', fallback: '⚔️' },
  'nav-habitos': { src: '/sprites/nav/nav-habitos.png', fallback: '🔥' },
  'nav-finanzas': { src: '/sprites/nav/nav-finanzas.png', fallback: '💰' },
  'nav-tareas': { src: '/sprites/nav/nav-tareas.png', fallback: '📋' },
  'nav-estudios': { src: '/sprites/nav/nav-estudios.png', fallback: '📚' },
  'nav-entrenamientos': { src: '/sprites/nav/nav-entrenamientos.png', fallback: '💪' },
  'nav-perfil': { src: '/sprites/nav/nav-perfil.png', fallback: '🛡️' },
  'nav-calendario': { src: '/sprites/nav/nav-calendario.png', fallback: '📅' },
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