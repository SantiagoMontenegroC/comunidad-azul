-- Gamificación — ejecutar en Supabase → SQL Editor (una sola vez)
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS destacado BOOLEAN DEFAULT false;
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS reconocimiento TEXT;
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS motivo_destacado TEXT;

-- Destacar reportes existentes (ajusta los id si hace falta)
UPDATE reportes
SET
  destacado = true,
  reconocimiento = 'Reportero destacado',
  motivo_destacado = 'Avisó a tiempo la llegada del agua en el sector.'
WHERE id = 1;

UPDATE reportes
SET
  destacado = true,
  reconocimiento = 'Contribución útil',
  motivo_destacado = 'Reportó con claridad un problema que ayudó a coordinar la comunidad.'
WHERE id = 2;
