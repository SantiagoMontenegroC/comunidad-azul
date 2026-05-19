-- ============================================
-- Comunidad Azul — Esquema de base de datos
-- Ejecutar en: Supabase → SQL Editor → New query
-- ============================================

-- Tabla 1: Puntos de venta
CREATE TABLE puntos_venta (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  direccion TEXT NOT NULL,
  horario TEXT,
  precio TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla 2: Reportes de la comunidad
CREATE TABLE reportes (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  sector TEXT,
  tipo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  estado TEXT DEFAULT 'Pendiente',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla 3: Mensajes de contacto
CREATE TABLE contactos (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leido BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Datos de prueba para puntos_venta
INSERT INTO puntos_venta (nombre, direccion, horario, precio, lat, lng) VALUES
('Punto Central', 'Calle 5 #10-20, Divino Niño 1', 'Lun-Sáb 7am-6pm', '$500/litro', 11.253092870380645, -74.17160776508045),
('Punto Norte', 'Carrera 8 #15-30, Divino Niño 1', 'Lun-Dom 6am-8pm', '$500/litro', 11.254994918626378, -74.17079120137323),
('Punto Sur', 'Calle 3 #5-10, Divino Niño 1', 'Mar-Dom 8am-5pm', '$600/litro', 11.251916597415095, -74.16874979210517);

-- Si la tabla ya existía sin coordenadas, ejecutar en SQL Editor:
-- ALTER TABLE puntos_venta ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
-- ALTER TABLE puntos_venta ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
-- UPDATE puntos_venta SET lat = 11.254994918626378, lng = -74.17079120137323 WHERE nombre = 'Punto Norte';
-- UPDATE puntos_venta SET lat = 11.251916597415095, lng = -74.16874979210517 WHERE nombre = 'Punto Sur';
-- UPDATE puntos_venta SET lat = 11.253092870380645, lng = -74.17160776508045 WHERE nombre = 'Punto Central';

-- ============================================
-- Políticas RLS (Row Level Security) para demo universitaria
-- Permite lectura pública y escritura con anon key
-- ============================================

ALTER TABLE puntos_venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactos ENABLE ROW LEVEL SECURITY;

-- Lectura pública de puntos activos
CREATE POLICY "Lectura puntos venta" ON puntos_venta
  FOR SELECT USING (true);

-- Lectura pública de reportes (feed comunitario)
CREATE POLICY "Lectura reportes" ON reportes
  FOR SELECT USING (true);

-- Cualquiera puede crear reportes
CREATE POLICY "Insertar reportes" ON reportes
  FOR INSERT WITH CHECK (true);

-- Cualquiera puede enviar contacto
CREATE POLICY "Insertar contactos" ON contactos
  FOR INSERT WITH CHECK (true);

-- ============================================
-- Realtime: habilitar en Dashboard
-- Database → Replication → agregar tabla "reportes"
-- ============================================
