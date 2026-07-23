-- =============================================================
-- Migración: módulo Biblioteca (rating, estados, tags)
-- Brief: modulo-biblioteca (C)
-- Fecha: 2026-07-22
-- Idempotente: se puede correr más de una vez sin error.
-- Depende del brief A (tags/book_tags), pero las crea si no existen.
-- =============================================================

-- 1. Rating: 0..5 con medias estrellas (NUMERIC(2,1): 0.0, 0.5, ..., 5.0)
ALTER TABLE books ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1);
DO $$ BEGIN
    ALTER TABLE books ADD CONSTRAINT books_rating_range
        CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Estados nuevos: pendiente | en_curso | leido | abandonado
--    Orden crítico: migrar los valores viejos ANTES de recrear el CHECK,
--    o el ADD CONSTRAINT falla por filas inválidas.
ALTER TABLE books DROP CONSTRAINT IF EXISTS books_status_check;
UPDATE books SET status = 'en_curso' WHERE status = 'leyendo';
UPDATE books SET status = 'leido'    WHERE status = 'terminado';
ALTER TABLE books ALTER COLUMN status SET DEFAULT 'pendiente';
DO $$ BEGIN
    ALTER TABLE books ADD CONSTRAINT books_status_check
        CHECK (status IN ('pendiente','en_curso','leido','abandonado'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. tags / book_tags (idempotente; ya las crea el brief A, pero C es autónomo)
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

-- 4. RLS (patrón del repo: DROP IF EXISTS + CREATE, auth.uid() = user_id)
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_tags ENABLE ROW LEVEL SECURITY;

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
