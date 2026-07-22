-- =============================================================
-- Migración: config editable + XP fraccional
-- Brief: config-y-xp-fraccional
-- Fecha: 2026-07-21
-- Idempotente: se puede correr más de una vez sin error.
-- =============================================================

-- 1. XP override por hábito (fijo). NULL = usa xp_config[TOGGLE_HABIT] (15).
--    Los hábitos son BINARIOS (marcado = hecho). No hay escalado por cantidad:
--    el agua se registra como "Tomar 2,5L de agua" (hecho/no hecho), no por ml.
ALTER TABLE habits ADD COLUMN IF NOT EXISTS xp_override INTEGER;

-- 1b. Renombrar el hábito de agua al modelo nuevo (2,5L binario en vez de 8 vasos)
UPDATE habits SET name = 'Tomar 2,5L de agua' WHERE name ILIKE 'agua%';

-- 2. Tabla xp_config: valores de XP por acción, editables desde /configuracion
CREATE TABLE IF NOT EXISTS xp_config (
    action_type TEXT PRIMARY KEY,
    xp_per_unit INTEGER NOT NULL,
    unit_size   NUMERIC,          -- NULL = XP fijo por acción (multiplicador 1)
    unit_label  TEXT,             -- 'min' | NULL
    cap_units   INTEGER,          -- NULL = sin tope
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Seed con los valores actuales de XP_REWARDS (gamification.py).
-- Lectura/estudio escalan por bloque de 30 min con tope de 4 unidades.
INSERT INTO xp_config (action_type, xp_per_unit, unit_size, unit_label, cap_units) VALUES
    ('ADD_EXPENSE', 10, NULL, NULL, NULL),
    ('ADD_EXPECTED', 5, NULL, NULL, NULL),
    ('CONFIRM_TRANSACTION', 10, NULL, NULL, NULL),
    ('TOGGLE_HABIT', 15, NULL, NULL, NULL),
    ('ADD_TASK', 5, NULL, NULL, NULL),
    ('LOG_STUDY', 20, 30, 'min', 4),
    ('LOG_WORKOUT', 20, NULL, NULL, NULL),
    ('SET_REMINDER', 5, NULL, NULL, NULL),
    ('QUERY_DATA', 0, NULL, NULL, NULL),
    ('ADD_SAVINGS', 10, NULL, NULL, NULL),
    ('WITHDRAW_SAVINGS', 0, NULL, NULL, NULL),
    ('LOG_READING', 15, 30, 'min', 4),
    ('FINISH_BOOK', 40, NULL, NULL, NULL),
    ('QUERY_ANALYTICS', 0, NULL, NULL, NULL),
    ('GET_RECOMMENDATION', 0, NULL, NULL, NULL),
    ('UNKNOWN', 0, NULL, NULL, NULL)
ON CONFLICT (action_type) DO NOTHING;

-- 3. Catálogo de tags (para Biblioteca — brief C) + join book_tags
CREATE TABLE IF NOT EXISTS tags (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES auth.users(id),
    name       TEXT NOT NULL,
    color      TEXT DEFAULT '#8a93c2',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS book_tags (
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    tag_id  UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, tag_id)
);

-- 4. Seed de tags iniciales
INSERT INTO tags (user_id, name)
SELECT (SELECT user_id FROM user_profile LIMIT 1), t
FROM unnest(ARRAY['Novela','Libro','Manga','Filosofía','Ciencia','Sci-Fi','Distópico','Política','Diálogo']) AS t
ON CONFLICT (user_id, name) DO NOTHING;

-- 5. RLS (patrón del repo: DROP IF EXISTS + CREATE, auth.uid() = user_id)
ALTER TABLE xp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_tags ENABLE ROW LEVEL SECURITY;

-- xp_config es global (sin user_id): lectura/escritura solo para usuarios autenticados.
-- El backend escribe con la service key (bypassea RLS); esta policy es para la webapp.
DROP POLICY IF EXISTS "Authenticated manage xp_config" ON xp_config;
CREATE POLICY "Authenticated manage xp_config" ON xp_config
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users manage own tags" ON tags;
CREATE POLICY "Users manage own tags" ON tags
    FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- book_tags no tiene user_id: la propiedad se deriva del libro.
DROP POLICY IF EXISTS "Users manage own book_tags" ON book_tags;
CREATE POLICY "Users manage own book_tags" ON book_tags
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM books b WHERE b.id = book_id AND b.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM books b WHERE b.id = book_id AND b.user_id = auth.uid()));
