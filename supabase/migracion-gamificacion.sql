-- Ejecutar en Supabase → SQL Editor (proyecto ya creado)
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS destacado BOOLEAN DEFAULT false;
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS reconocimiento TEXT;
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS motivo_destacado TEXT;

-- Ejemplo: destacar un reporte existente (cambia el id)
-- UPDATE reportes SET destacado = true, reconocimiento = 'Reportero destacado',
--   motivo_destacado = 'Avisó a tiempo la llegada del agua en el sector.'
-- WHERE id = 1;
