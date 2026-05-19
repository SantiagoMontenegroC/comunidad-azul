/**
 * supabase.js — Configuración y funciones de base de datos
 * Comunidad Azul | Proyecto universitario
 *
 * IMPORTANTE: Reemplaza TU_URL_AQUI y TU_KEY_AQUI con tus credenciales
 * del panel de Supabase → Settings → API
 */

// Solo la URL base del proyecto (sin /rest/v1 — el SDK la agrega solo)
const SUPABASE_URL = 'https://xyzyqkxdvdmyoevetxyw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5enlxa3hkdmRteW9ldmV0eHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTc4MjcsImV4cCI6MjA5NDc5MzgyN30.poLZHgQZ1DMLDFqBxtRru6tc7BoaldVdkESwsxV0hcA';

// Cliente global de Supabase (CDN cargado en index.html)
let supabaseClient = null;

/**
 * Inicializa la conexión con Supabase.
 * Debe llamarse una vez al cargar la página.
 */
function initSupabase() {
  if (typeof supabase === 'undefined') {
    console.error('La librería de Supabase no está cargada. Verifica el script CDN en index.html.');
    return null;
  }

  if (SUPABASE_URL === 'TU_URL_AQUI' || SUPABASE_KEY === 'TU_KEY_AQUI') {
    console.warn(
      '⚠️ Configura SUPABASE_URL y SUPABASE_KEY en js/supabase.js con tus credenciales reales.'
    );
    return null;
  }

  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  return supabaseClient;
}

/**
 * Obtiene el cliente activo o null si no está configurado.
 */
function getSupabase() {
  return supabaseClient;
}

/**
 * SELECT — Puntos de venta activos
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
async function cargarPuntosVenta() {
  const client = getSupabase();
  if (!client) {
    return { data: null, error: { message: 'Supabase no configurado' } };
  }

  return client
    .from('puntos_venta')
    .select('id, nombre, direccion, horario, precio, activo, lat, lng')
    .order('nombre', { ascending: true });
}

/**
 * INSERT — Nuevo reporte comunitario
 * @param {Object} datos - { nombre, sector, tipo, descripcion }
 */
async function enviarReporte(datos) {
  const client = getSupabase();
  if (!client) {
    return { data: null, error: { message: 'Supabase no configurado' } };
  }

  return client.from('reportes').insert([
    {
      nombre: datos.nombre,
      sector: datos.sector,
      tipo: datos.tipo,
      descripcion: datos.descripcion,
      estado: 'Pendiente',
    },
  ]);
}

/**
 * SELECT — Últimos 10 reportes (más recientes primero)
 */
async function cargarReportes() {
  const client = getSupabase();
  if (!client) {
    return { data: null, error: { message: 'Supabase no configurado' } };
  }

  return client
    .from('reportes')
    .select('id, nombre, sector, tipo, descripcion, estado, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
}

/**
 * INSERT — Mensaje del formulario de contacto
 * @param {Object} datos - { nombre, email, mensaje }
 */
async function enviarContacto(datos) {
  const client = getSupabase();
  if (!client) {
    return { data: null, error: { message: 'Supabase no configurado' } };
  }

  return client.from('contactos').insert([
    {
      nombre: datos.nombre,
      email: datos.email,
      mensaje: datos.mensaje,
    },
  ]);
}

/**
 * Suscripción en tiempo real a la tabla reportes.
 * Cuando hay INSERT/UPDATE/DELETE, ejecuta el callback.
 * @param {Function} callback - función que recarga el feed
 * @returns {object|null} canal de suscripción
 */
function suscribirReportesRealtime(callback) {
  const client = getSupabase();
  if (!client) return null;

  const channel = client
    .channel('reportes-cambios')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reportes' },
      () => {
        if (typeof callback === 'function') callback();
      }
    )
    .subscribe();

  return channel;
}
