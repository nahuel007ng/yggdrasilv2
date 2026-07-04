-- =============================================================
-- Yggdrasil v2 — Seeds para Supabase
-- Brief: bot-telegram-mvp | Fase 03
-- =============================================================

-- 1. Categorías de gastos
INSERT INTO categories (name, type, is_default) VALUES
    ('Comida', 'expense', true),
    ('Transporte', 'expense', true),
    ('Entretenimiento', 'expense', true),
    ('Servicios', 'expense', true),
    ('Alquiler', 'expense', true),
    ('Salud', 'expense', true),
    ('Ropa', 'expense', true),
    ('Tecnología', 'expense', true),
    ('Educación', 'expense', true),
    ('Otros', 'expense', true);

-- 2. Categorías de ingresos
INSERT INTO categories (name, type, is_default) VALUES
    ('Sueldo CPCEC', 'income', true),
    ('Sueldo NODO', 'income', true),
    ('Otros', 'income', true);

-- 3. Materias de la carrera
INSERT INTO subjects (name, is_active) VALUES
    ('Análisis Matemático I', true),
    ('Programación II', true),
    ('Geometría', true),
    ('Lógica', true),
    ('Estadística y CD I', true),
    ('Estructura de Datos y Algoritmos I', true);

-- 4. Hábitos default
INSERT INTO habits (name, frequency) VALUES
    ('Ejercicio', 'daily'),
    ('Lectura', 'daily'),
    ('Agua (8 vasos)', 'daily'),
    ('Estudio', 'daily'),
    ('Meditación', 'daily');

-- 5. Cuenta default
INSERT INTO accounts (name, currency, is_default) VALUES
    ('Efectivo', 'ARS', true);

-- 6. User profile inicial
INSERT INTO user_profile (display_name) VALUES
    ('Nahuel');
