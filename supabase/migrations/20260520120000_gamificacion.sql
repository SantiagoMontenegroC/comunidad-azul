-- Gamificación: reconocimiento manual de aportes en reportes
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS destacado BOOLEAN DEFAULT false;
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS reconocimiento TEXT;
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS motivo_destacado TEXT;

-- Permite al administrador actualizar destacados desde Table Editor o API (demo universitaria)
DROP POLICY IF EXISTS "Actualizar gamificacion reportes" ON reportes;
CREATE POLICY "Actualizar gamificacion reportes" ON reportes
  FOR UPDATE USING (true) WITH CHECK (true);

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
