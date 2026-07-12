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

-- 3. Materias de la carrera (38 - Lic. en Ciencias de Datos)
-- Aprobadas: Intro Computación(9), Intro CD(8), Intro Matemática(8), Álgebra(9), Programación I(9)
INSERT INTO subjects (user_id, name, code, status, grade, year, semester, correlative_codes, is_active) VALUES
    -- 1er Año, 1er Cuatrimestre
    ((SELECT id FROM auth.users LIMIT 1), 'Introduccion a la Computacion', 1, 'aprobada', 9, 1, 1, '{}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Introduccion a la Ciencia de Datos', 2, 'aprobada', 8, 1, 1, '{}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Introduccion a la Matematica', 3, 'aprobada', 8, 1, 1, '{}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Ingles Tecnico I', 4, 'pendiente', NULL, 1, 1, '{}', true),
    -- 1er Año, 2do Cuatrimestre
    ((SELECT id FROM auth.users LIMIT 1), 'Programacion I', 5, 'aprobada', 9, 1, 2, '{1}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Algebra', 6, 'aprobada', 9, 1, 2, '{3}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Geometria', 7, 'pendiente', NULL, 1, 2, '{3}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Ingles Tecnico II', 8, 'pendiente', NULL, 1, 2, '{4}', true),
    -- 2do Año, 1er Cuatrimestre
    ((SELECT id FROM auth.users LIMIT 1), 'Estadistica y Ciencia de Datos I', 9, 'pendiente', NULL, 2, 1, '{2,3}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Logica', 10, 'pendiente', NULL, 2, 1, '{3,5}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Analisis Matematico I', 11, 'pendiente', NULL, 2, 1, '{3,6}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Ingles Tecnico III', 12, 'pendiente', NULL, 2, 1, '{8}', true),
    -- 2do Año, 2do Cuatrimestre
    ((SELECT id FROM auth.users LIMIT 1), 'Programacion II', 13, 'pendiente', NULL, 2, 2, '{5}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Sistemas Operativos', 14, 'pendiente', NULL, 2, 2, '{1,2}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Algebra Lineal Computacional', 15, 'pendiente', NULL, 2, 2, '{6}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Estructura de Datos y Algoritmos I', 16, 'pendiente', NULL, 2, 2, '{5}', true),
    -- 3er Año, 1er Cuatrimestre
    ((SELECT id FROM auth.users LIMIT 1), 'Probabilidad', 17, 'pendiente', NULL, 3, 1, '{9}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Laboratorio de Datos', 18, 'pendiente', NULL, 3, 1, '{16}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Vision por Computadora', 19, 'pendiente', NULL, 3, 1, '{7,10,12}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Base de Datos', 20, 'pendiente', NULL, 3, 1, '{5,16}', true),
    -- 3er Año, 2do Cuatrimestre
    ((SELECT id FROM auth.users LIMIT 1), 'Programacion III', 21, 'pendiente', NULL, 3, 2, '{5,13,20}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Analisis Numerico', 22, 'pendiente', NULL, 3, 2, '{11,15}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Analisis de Grandes Volumenes de Datos', 23, 'pendiente', NULL, 3, 2, '{14,17,19}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Infraestructura para Ciencia de Datos', 24, 'pendiente', NULL, 3, 2, '{9,18}', true),
    -- 4to Año, 1er Cuatrimestre
    ((SELECT id FROM auth.users LIMIT 1), 'Introduccion a la Inteligencia Artificial', 25, 'pendiente', NULL, 4, 1, '{18,19}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Analisis Matematico II', 26, 'pendiente', NULL, 4, 1, '{11}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Analisis Avanzado', 27, 'pendiente', NULL, 4, 1, '{11,22}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Ciencias de Datos', 28, 'pendiente', NULL, 4, 1, '{24}', true),
    -- 4to Año, 2do Cuatrimestre
    ((SELECT id FROM auth.users LIMIT 1), 'Investigacion Operativa y la Optimizacion', 29, 'pendiente', NULL, 4, 2, '{19}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Introduccion al Modelado Continuo', 30, 'pendiente', NULL, 4, 2, '{11,27}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Introduccion al Analisis Funcional', 31, 'pendiente', NULL, 4, 2, '{11,17,26}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Herramientas de Estadistica Computacional', 32, 'pendiente', NULL, 4, 2, '{23,25}', true),
    -- 5to Año, 1er Cuatrimestre
    ((SELECT id FROM auth.users LIMIT 1), 'Etica Profesional', 33, 'pendiente', NULL, 5, 1, '{28}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Modelos de Programacion', 34, 'pendiente', NULL, 5, 1, '{21}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Estadistica y Ciencia de Datos II', 35, 'pendiente', NULL, 5, 1, '{9,17}', true),
    -- 5to Año, 2do Cuatrimestre
    ((SELECT id FROM auth.users LIMIT 1), 'Estadistica y Ciencia de Datos III', 36, 'pendiente', NULL, 5, 2, '{35}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Herramientas de Visualizacion de datos', 37, 'pendiente', NULL, 5, 2, '{29,30,31,32}', true),
    ((SELECT id FROM auth.users LIMIT 1), 'Trabajo Final de Licenciatura en Ciencias de Datos', 38, 'pendiente', NULL, 5, 2, '{33,34,36,37}', true);

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
