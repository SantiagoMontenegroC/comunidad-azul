/**
 * reportes.js — Formulario y feed de reportes con Supabase Realtime
 */

const formReporte = document.getElementById('form-reporte');
const msgReporte = document.getElementById('msg-reporte');
const listaReportes = document.getElementById('reportes-list');

/** Formatea fecha para mostrar en el feed */
function formatearFecha(isoString) {
  if (!isoString) return '';
  const fecha = new Date(isoString);
  return fecha.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Clase CSS del badge según estado */
function claseBadge(estado) {
  const e = (estado || 'Pendiente').toLowerCase();
  if (e.includes('resuelto')) return 'badge--resuelto';
  if (e.includes('proceso')) return 'badge--proceso';
  return 'badge--pendiente';
}

function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

/** Renderiza el feed de reportes */
function renderizarReportes(reportes) {
  if (!listaReportes) return;

  if (!reportes || reportes.length === 0) {
    listaReportes.innerHTML =
      '<p class="reportes-loading">Aún no hay reportes. ¡Sé el primero en reportar!</p>';
    return;
  }

  listaReportes.innerHTML = reportes
    .map(
      (r) => `
    <article class="reporte-item fade-in visible">
      <div class="reporte-item__top">
        <span class="reporte-item__nombre">${escaparHtml(r.nombre)}</span>
        <span class="badge ${claseBadge(r.estado)}">${escaparHtml(r.estado || 'Pendiente')}</span>
      </div>
      <p class="reporte-item__tipo">${escaparHtml(r.tipo)}${r.sector ? ` · ${escaparHtml(r.sector)}` : ''}</p>
      <p class="reporte-item__desc">${escaparHtml(r.descripcion)}</p>
      <div class="reporte-item__footer">
        <span>${formatearFecha(r.created_at)}</span>
      </div>
    </article>
  `
    )
    .join('');
}

/** Carga reportes desde la BD */
async function actualizarFeedReportes() {
  if (!listaReportes) return;

  listaReportes.innerHTML = '<p class="reportes-loading">Cargando reportes...</p>';

  const { data, error } = await cargarReportes();

  if (error) {
    listaReportes.innerHTML = `<p class="puntos-error">Error: ${escaparHtml(error.message)}</p>`;
    actualizarIndicadorBD(false);
    return;
  }

  renderizarReportes(data);
  actualizarIndicadorBD(true);
}

/** Muestra mensaje de éxito o error en el formulario */
function mostrarMensajeReporte(tipo, texto) {
  if (!msgReporte) return;
  msgReporte.className = `form-message form-message--${tipo}`;
  msgReporte.textContent = texto;
  msgReporte.style.display = 'block';
}

/** Envío del formulario de reporte */
async function manejarEnvioReporte(e) {
  e.preventDefault();
  if (!formReporte) return;

  const datos = {
    nombre: formReporte.nombre.value.trim(),
    sector: formReporte.sector.value.trim(),
    tipo: formReporte.tipo.value,
    descripcion: formReporte.descripcion.value.trim(),
  };

  if (!datos.nombre || !datos.tipo || !datos.descripcion) {
    mostrarMensajeReporte('error', 'Completa los campos obligatorios.');
    return;
  }

  const btn = formReporte.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  const { error } = await enviarReporte(datos);

  btn.disabled = false;
  btn.innerHTML =
    '<span class="material-symbols-outlined">send</span> Enviar Reporte';

  if (error) {
    mostrarMensajeReporte('error', `No se pudo enviar: ${error.message}`);
    return;
  }

  mostrarMensajeReporte('success', '¡Reporte registrado! Aparecerá en el feed de la comunidad.');
  formReporte.reset();
  await actualizarFeedReportes();
  if (typeof actualizarEstadisticasHero === 'function') {
    await actualizarEstadisticasHero();
  }
}

/** Inicialización de reportes */
function initReportes() {
  if (formReporte) {
    formReporte.addEventListener('submit', manejarEnvioReporte);
  }

  actualizarFeedReportes();

  // Suscripción en tiempo real (INSERT/UPDATE/DELETE en tabla reportes)
  suscribirReportesRealtime(actualizarFeedReportes);
}

document.addEventListener('DOMContentLoaded', initReportes);
