-- ==========================================================================
-- SUPABASE SCHEMA - Web App Analítica de Canchas Sintéticas (Pereira)
-- Ejecutar en el SQL Editor de tu proyecto en Supabase (https://supabase.com)
-- ==========================================================================

-- 1. TABLA DE SEDES / COMPLEJOS EN PEREIRA
CREATE TABLE IF NOT EXISTS sedes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(120) NOT NULL,
    sector VARCHAR(80) NOT NULL,
    direccion VARCHAR(200),
    telefono VARCHAR(30),
    estado VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA DE CANCHAS POR SEDE
CREATE TABLE IF NOT EXISTS canchas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID REFERENCES sedes(id) ON DELETE CASCADE,
    nombre VARCHAR(80) NOT NULL,
    tipo VARCHAR(30) NOT NULL, -- 'Fútbol 5', 'Fútbol 7', 'Fútbol 8', 'Fútbol 11'
    superficie VARCHAR(50) DEFAULT 'Sintética Techada',
    tarifa_base_hora NUMERIC(12, 2) NOT NULL DEFAULT 80000,
    estado VARCHAR(20) DEFAULT 'disponible',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABLA DE RESERVAS Y OCUPACIÓN HORARIA
CREATE TABLE IF NOT EXISTS reservas_ocupacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cancha_id UUID REFERENCES canchas(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado VARCHAR(30) DEFAULT 'completada', -- 'completada', 'en_curso', 'cancelada', 'mantenimiento'
    valor_pagado NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tipo_cliente VARCHAR(50) DEFAULT 'Esporádico', -- 'Frecuente', 'Esporádico', 'Torneo Nocturno'
    metodo_pago VARCHAR(50) DEFAULT 'Efectivo',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
ALTER TABLE sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE canchas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas_ocupacion ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública a través de la Anon Key
CREATE POLICY "Permitir lectura anon sedes" ON sedes FOR SELECT USING (true);
CREATE POLICY "Permitir lectura anon canchas" ON canchas FOR SELECT USING (true);
CREATE POLICY "Permitir lectura anon reservas" ON reservas_ocupacion FOR SELECT USING (true);

-- 5. DATOS DE EJEMPLO DE PEREIRA
INSERT INTO sedes (id, nombre, sector, direccion, telefono, estado) VALUES
('11111111-1111-1111-1111-111111111111', 'Complejo Maracaná Pereira', 'Circunvalar', 'Av. Circunvalar # 12-45', '311-7894561', 'activo'),
('22222222-2222-2222-2222-222222222222', 'Canchas El Golazo Cuba', 'Cuba', 'Cra. 25 # 68-10, Barrio Cuba', '314-5552390', 'activo'),
('33333333-3333-3333-3333-333333333333', 'La Bombonera Sintética', 'Álamos', 'Calle 14 # 23-15, Los Álamos', '318-4439012', 'activo'),
('44444444-4444-4444-4444-444444444444', 'Camp Nou Cerritos Sports', 'Cerritos', 'Km 8 Vía Cerritos - Pereira', '310-9988771', 'activo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO canchas (id, sede_id, nombre, tipo, superficie, tarifa_base_hora, estado) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Maracaná 1 (Techada)', 'Fútbol 5', 'Sintética Techada', 90000, 'disponible'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Maracaná 2 (F7)', 'Fútbol 7', 'Sintética al Aire Libre', 140000, 'disponible'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Golazo Central', 'Fútbol 5', 'Sintética Techada', 80000, 'disponible'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 'Bombonera Norte', 'Fútbol 5', 'Sintética Techada', 85000, 'disponible')
ON CONFLICT (id) DO NOTHING;
