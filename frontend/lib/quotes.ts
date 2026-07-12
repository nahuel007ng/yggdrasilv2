export const PHILOSOPHER_QUOTES: string[] = [
  '"El que conquista a otros es fuerte; el que se conquista a sí mismo es poderoso." — Lao Tzu',
  '"Somos lo que hacemos repetidamente. La excelencia no es un acto, sino un hábito." — Aristóteles',
  '"El secreto del cambio es enfocar toda tu energía en construir lo nuevo." — Sócrates',
  '"No es la montaña lo que conquistamos, sino a nosotros mismos." — Edmund Hillary',
  '"El camino de mil millas comienza con un solo paso." — Lao Tzu',
  '"La disciplina es el puente entre las metas y los logros." — Jim Rohn',
  '"Nada grandioso se ha logrado sin entusiasmo." — Emerson',
  '"La persistencia es al carácter lo que el carbono al acero." — Napoleón Hill',
  '"El conocimiento es poder." — Francis Bacon',
  '"Vive como si fueras a morir mañana. Aprende como si fueras a vivir para siempre." — Gandhi',
  '"El hombre que mueve montañas comienza cargando pequeñas piedras." — Confucio',
  '"La victoria pertenece al más perseverante." — Napoleón',
  '"Todo poder del hombre es una mezcla de tiempo y paciencia." — Balzac',
  '"Sé el cambio que quieres ver en el mundo." — Gandhi',
  '"Solo sé que no sé nada." — Sócrates',
];

export function getRandomQuote(): string {
  return PHILOSOPHER_QUOTES[Math.floor(Math.random() * PHILOSOPHER_QUOTES.length)];
}