-- =============================================================
-- Migracion: Auth Supabase + RLS
-- Brief: notificaciones-auth
-- Fecha: 2026-07-09
-- UUID del usuario: 68a11a71-c497-4db5-8a5e-e7fa1217243a
--
-- EJECUTAR PASO A PASO en Supabase SQL Editor.
-- NO ejecutar todo de una — seguir el orden.
-- =============================================================

-- =============================================
-- PASO 1: Agregar columna user_id a todas las tablas
-- =============================================

ALTER TABLE tasks ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE habits ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE habit_records ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE transactions ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE accounts ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE subjects ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE topics ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE study_sessions ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE workouts ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE exercises ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE exercise_sets ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE reminders ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE user_profile ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE xp_events ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE badges ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- =============================================
-- PASO 2: Migrar datos existentes con el user_id
-- =============================================

UPDATE tasks SET user_id = '68a11a71-c497-4db5-8a5e-e7fa1217243a' WHERE user_id IS NULL;
UPDATE habits SET user_id = '68a11a71-c497-4db5-8a5e-e7fa1217243a' WHERE user_id IS NULL;
UPDATE habit_records SET user_id = '68a11a71-c497-4db5-8a5e-e7fa1217243a' WHERE user_id IS NULL;
UPDATE transactions SET user_id = '68a11a71-c497-4db5-8a5e-e7fa1217243a' WHERE user_id IS NULL;
UPDATE accounts SET user_id = '68a11a71-c497-4db5-8a5e-e7fa1217243a' WHERE user_id IS NULL;
UPDATE categories SET user_id = '68a11a71-c497-4db5-8a5e-e7fa1217243a' WHERE user_id IS NULL;
UPDATE subjects SET user_id = '68a11a71-c497-4db5-8a5e-e7fa1217243a' WHERE user_id IS NULL;
UPDATE topics SET user_id = '68a11a71-c497-4db5-8a5e-e7fa1217243a' WHERE user_id IS NULL;
UPDATE study_sessions SET user_id = '68a11a71-c497-4db5-8a5e-e7fa1217243a' WHERE user_id IS NULL;
UPDATE workouts SET user_id = '68a11a71-c497-4db5-8a5e-e7fa1217243a' WHERE user_id IS NULL;
UPDATE exercises SET user_id = '68a11a71-c497-4db5-8a5e-e7fa1217243a' WHERE user_id IS NULL;
UPDATE exercise_sets SET user_id = '68a11a71-c497-4db5-8a5e-e7fa1217243a' WHERE user_id IS NULL;
UPDATE reminders SET user_id = '68a11a71-c497-4db5-8a5e-e7fa1217243a' WHERE user_id IS NULL;
UPDATE user_profile SET user_id = '68a11a71-c497-4db5-8a5e-e7fa1217243a' WHERE user_id IS NULL;
UPDATE xp_events SET user_id = '68a11a71-c497-4db5-8a5e-e7fa1217243a' WHERE user_id IS NULL;
UPDATE badges SET user_id = '68a11a71-c497-4db5-8a5e-e7fa1217243a' WHERE user_id IS NULL;

-- =============================================
-- PASO 3: Hacer user_id NOT NULL
-- (ejecutar DESPUES de confirmar que el paso 2 funciono)
-- =============================================

ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE habits ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE habit_records ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE accounts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE subjects ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE topics ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE study_sessions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE workouts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE exercises ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE exercise_sets ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE reminders ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE user_profile ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE xp_events ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE badges ALTER COLUMN user_id SET NOT NULL;

-- =============================================
-- PASO 4: Migrar RLS policies
-- Eliminar policies viejas y crear nuevas con auth.uid()
-- =============================================

-- tasks
DROP POLICY IF EXISTS "Allow anon read" ON tasks;
DROP POLICY IF EXISTS "Allow anon insert" ON tasks;
DROP POLICY IF EXISTS "Allow anon update" ON tasks;
DROP POLICY IF EXISTS "Allow anon delete" ON tasks;
CREATE POLICY "Users read own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);

-- habits
DROP POLICY IF EXISTS "Allow anon read" ON habits;
DROP POLICY IF EXISTS "Allow anon insert" ON habits;
DROP POLICY IF EXISTS "Allow anon update" ON habits;
CREATE POLICY "Users read own habits" ON habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own habits" ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own habits" ON habits FOR UPDATE USING (auth.uid() = user_id);

-- habit_records
DROP POLICY IF EXISTS "Allow anon read" ON habit_records;
DROP POLICY IF EXISTS "Allow anon insert" ON habit_records;
DROP POLICY IF EXISTS "Allow anon update" ON habit_records;
CREATE POLICY "Users read own habit_records" ON habit_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own habit_records" ON habit_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own habit_records" ON habit_records FOR UPDATE USING (auth.uid() = user_id);

-- transactions
DROP POLICY IF EXISTS "Allow anon read" ON transactions;
DROP POLICY IF EXISTS "Allow anon insert" ON transactions;
CREATE POLICY "Users read own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- categories
DROP POLICY IF EXISTS "Allow anon read" ON categories;
CREATE POLICY "Users read own categories" ON categories FOR SELECT USING (auth.uid() = user_id);

-- accounts
DROP POLICY IF EXISTS "Allow anon read" ON accounts;
CREATE POLICY "Users read own accounts" ON accounts FOR SELECT USING (auth.uid() = user_id);

-- subjects
DROP POLICY IF EXISTS "Allow anon read" ON subjects;
CREATE POLICY "Users read own subjects" ON subjects FOR SELECT USING (auth.uid() = user_id);

-- topics
DROP POLICY IF EXISTS "Allow anon read" ON topics;
CREATE POLICY "Users read own topics" ON topics FOR SELECT USING (auth.uid() = user_id);

-- study_sessions
DROP POLICY IF EXISTS "Allow anon read" ON study_sessions;
CREATE POLICY "Users read own study_sessions" ON study_sessions FOR SELECT USING (auth.uid() = user_id);

-- workouts
DROP POLICY IF EXISTS "Allow anon read" ON workouts;
CREATE POLICY "Users read own workouts" ON workouts FOR SELECT USING (auth.uid() = user_id);

-- exercises
DROP POLICY IF EXISTS "Allow anon read" ON exercises;
CREATE POLICY "Users read own exercises" ON exercises FOR SELECT USING (auth.uid() = user_id);

-- exercise_sets
DROP POLICY IF EXISTS "Allow anon read" ON exercise_sets;
CREATE POLICY "Users read own exercise_sets" ON exercise_sets FOR SELECT USING (auth.uid() = user_id);

-- reminders
DROP POLICY IF EXISTS "Allow anon read" ON reminders;
CREATE POLICY "Users read own reminders" ON reminders FOR SELECT USING (auth.uid() = user_id);

-- user_profile
DROP POLICY IF EXISTS "Allow anon read" ON user_profile;
DROP POLICY IF EXISTS "Allow anon update" ON user_profile;
CREATE POLICY "Users read own profile" ON user_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON user_profile FOR UPDATE USING (auth.uid() = user_id);

-- xp_events
DROP POLICY IF EXISTS "Allow anon read" ON xp_events;
CREATE POLICY "Users read own xp_events" ON xp_events FOR SELECT USING (auth.uid() = user_id);

-- badges
DROP POLICY IF EXISTS "Allow anon read" ON badges;
CREATE POLICY "Users read own badges" ON badges FOR SELECT USING (auth.uid() = user_id);
