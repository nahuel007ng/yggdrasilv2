-- =============================================================
-- Migración: exámenes académicos (parciales/TPs/finales)
-- Brief: modulo-academico
-- Fecha: 2026-07-22
-- Idempotente: se puede correr más de una vez sin error.
-- =============================================================

-- Tabla exams: registro de exámenes con nota y fecha, ligados a una materia.
-- Sin promoción automática: registrar exámenes NO cambia subjects.status —
-- la materia se aprueba manualmente (bot UPDATE_SUBJECT o PATCH /subjects).
-- subjects.grade queda INTEGER (nota final entera); exams.grade es NUMERIC
-- para parciales/promedios con decimales (7.5).
CREATE TABLE IF NOT EXISTS exams (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES auth.users(id),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    type       TEXT NOT NULL DEFAULT 'final'
                   CHECK (type IN ('parcial', 'tp', 'final', 'otro')),
    grade      NUMERIC(4,2),        -- nota del examen. NULL = aún sin nota.
    date       DATE,                -- fecha del examen (para el calendario)
    notes      TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS exams_subject_idx ON exams (subject_id);
CREATE INDEX IF NOT EXISTS exams_date_idx ON exams (date);

-- RLS (patrón del repo: DROP IF EXISTS + CREATE, auth.uid() = user_id)
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own exams" ON exams;
CREATE POLICY "Users manage own exams" ON exams
    FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
