-- =============================================================
-- Migración Gamificación V2.2 (brief gamificacion-v2-2)
-- Dominio de lectura + títulos. Aplicar en Supabase SQL Editor.
-- =============================================================

-- 1. Libros
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    category TEXT NOT NULL DEFAULT 'otro'
        CHECK (category IN ('clasico', 'filosofia', 'ciencia', 'otro')),
    status TEXT NOT NULL DEFAULT 'leyendo'
        CHECK (status IN ('leyendo', 'terminado', 'abandonado')),
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_books_user_status ON books (user_id, status);
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own books" ON books;
CREATE POLICY "Users can manage own books" ON books
    FOR ALL USING (auth.uid() = user_id);

-- 2. Sesiones de lectura
CREATE TABLE IF NOT EXISTS reading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    book_id UUID REFERENCES books(id),
    duration_minutes INTEGER NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_date ON reading_sessions (user_id, date);
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own reading" ON reading_sessions;
CREATE POLICY "Users can manage own reading" ON reading_sessions
    FOR ALL USING (auth.uid() = user_id);

-- 3. Títulos desbloqueados
CREATE TABLE IF NOT EXISTS user_titles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    code TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_titles_user_code ON user_titles (user_id, code);
ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own titles" ON user_titles;
CREATE POLICY "Users can view own titles" ON user_titles
    FOR SELECT USING (auth.uid() = user_id);

-- 4. Título activo equipado
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS active_title TEXT;

-- 5. Policy de UPDATE para user_profile.
--    Ya existe en migration-auth.sql (línea 151):
--    "Users update own profile" ON user_profile FOR UPDATE USING (auth.uid() = user_id).
--    No se recrea para evitar conflicto.
-- DROP POLICY IF EXISTS "Users update own profile" ON user_profile;
-- CREATE POLICY "Users update own profile" ON user_profile
--     FOR UPDATE USING (auth.uid() = user_id);
