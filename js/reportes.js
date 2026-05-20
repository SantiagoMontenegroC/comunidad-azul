/**
 * reportes.js — Formulario y feed de reportes con Supabase Realtime
 */

const formReporte = document.getElementById('form-reporte');
const msgReporte = document.getElementById('msg-reporte');
const listaReportes = document.getElementById('reportes-list');
const listaAportesDestacados = document.getElementById('aportes-destacados-list');

/** Ejemplos locales si aún no hay columnas de gamificación en Supabase */
const APORTES_DESTACADOS_EJEMPLO = [
  {
    nombre: 'María Elena R.',
    sector: 'Sector Norte',
    reconocimiento: 'Reportero destacado',
    motivo_destacado:
      'Informó oportunamente la llegada del agua y ayudó a avisar a varias familias del bloque.',
    tipo: 'Falta de agua',
  },
  {
    nombre: 'Carlos Andrés M.',
    sector: 'Punto Central',
    reconocimiento: 'Contribución útil',
    motivo_destacado:
      'Reportó una fuga cercana al tanque con descripción clara; facilitó la coordinación comunitaria.',
    tipo: 'Tubería dañada',
  },
];

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

function iconoReconocimiento(reconocimiento) {
  const r = (reconocimiento || '').toLowerCase();
  if (r.includes('reportero')) return 'military_tech';
  return 'volunteer_activism';
}

function claseReconocimiento(reconocimiento) {
  const r = (reconocimiento || '').toLowerCase();
  if (r.includes('reportero')) return 'badge-reconocimiento--reportero';
  return 'badge-reconocimiento--util';
}

function esDestacado(reporte) {
  return reporte.destacado === true || reporte.destacado === 'true';
}

function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

function htmlBadgeReconocimiento(reconocimiento) {
  if (!reconocimiento) return '';
  return `<span class="badge-reconocimiento ${claseReconocimiento(reconocimiento)}">
    <span class="material-symbols-outlined material-symbols-outlined--fill" aria-hidden="true">${iconoReconocimiento(reconocimiento)}</span>
    ${escaparHtml(reconocimiento)}
  </span>`;
}

function htmlAporteDestacado(aporte, esEjemplo) {
  const reconocimiento = aporte.reconocimiento || 'Contribución útil';
  const motivo =
    aporte.motivo_destacado ||
    (aporte.descripcion ? String(aporte.descripcion).slice(0, 160) : '');
  const tipo = aporte.tipo ? `<p class="aporte-card__tipo">${escaparHtml(aporte.tipo)}</p>` : '';

  return `
    <article class="aporte-card${esEjemplo ? ' aporte-card--ejemplo' : ''}">
      <div class="aporte-card__icon" aria-hidden="true">
        <span class="material-symbols-outlined material-symbols-outlined--fill">${iconoReconocimiento(reconocimiento)}</span>
      </div>
      ${htmlBadgeReconocimiento(reconocimiento)}
      <h4 class="aporte-card__nombre">${escaparHtml(aporte.nombre)}</h4>
      ${aporte.sector ? `<p class="aporte-card__sector">${escaparHtml(aporte.sector)}</p>` : ''}
      ${tipo}
      <p class="aporte-card__motivo">${escaparHtml(motivo)}</p>
    </article>
  `;
}

function renderizarAportesDestacados(aportes, esEjemplo) {
  if (!listaAportesDestacados) return;

  if (!aportes || aportes.length === 0) {
    listaAportesDestacados.innerHTML =
      '<p class="aportes-destacados__vacio">Aún no hay aportes destacados. La junta comunitaria reconocerá aquí las contribuciones más útiles.</p>';
    const bloque = document.getElementById('aportes-destacados');
    if (bloque) bloque.classList.remove('aportes-destacados--ejemplo');
    return;
  }

  listaAportesDestacados.innerHTML = aportes
    .map((a) => htmlAporteDestacado(a, esEjemplo))
    .join('');

  const bloque = document.getElementById('aportes-destacados');
  if (bloque) bloque.classList.toggle('aportes-destacados--ejemplo', Boolean(esEjemplo));
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
    .map((r) => {
      const destacado = esDestacado(r);
      const badgeReconocimiento =
        destacado && r.reconocimiento ? htmlBadgeReconocimiento(r.reconocimiento) : '';

      return `
    <article class="reporte-item fade-in visible${destacado ? ' reporte-item--destacado' : ''}">
      <div class="reporte-item__top">
        <span class="reporte-item__nombre">${escaparHtml(r.nombre)}</span>
        <div class="reporte-item__badges">
          ${badgeReconocimiento}
          <span class="badge ${claseBadge(r.estado)}">${escaparHtml(r.estado || 'Pendiente')}</span>
        </div>
      </div>
      <p class="reporte-item__tipo">${escaparHtml(r.tipo)}${r.sector ? ` · ${escaparHtml(r.sector)}` : ''}</p>
      <p class="reporte-item__desc">${escaparHtml(r.descripcion)}</p>
      <div class="reporte-item__footer">
        <span>${formatearFecha(r.created_at)}</span>
      </div>
    </article>
  `;
    })
    .join('');
}

/** Carga aportes destacados (BD o ejemplos ilustrativos) */
async function actualizarAportesDestacados() {
  if (!listaAportesDestacados) return;

  listaAportesDestacados.innerHTML =
    '<p class="aportes-destacados__vacio">Cargando reconocimientos…</p>';

  const { data, error } = await cargarAportesDestacados();

  if (error) {
    listaAportesDestacados.innerHTML = `<p class="puntos-error">${escaparHtml(error.message)}</p>`;
    return;
  }

  if (data && data.length > 0) {
    renderizarAportesDestacados(data, false);
    return;
  }

  const { data: reportes } = await cargarReportes();
  const tieneGamificacion =
    reportes && reportes.some((r) => Object.prototype.hasOwnProperty.call(r, 'destacado'));

  if (!tieneGamificacion) {
    renderizarAportesDestacados(APORTES_DESTACADOS_EJEMPLO, true);
    return;
  }

  renderizarAportesDestacados([], false);
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
  await refrescarSeccionReportes();
}

async function refrescarSeccionReportes() {
  await actualizarFeedReportes();
  await actualizarAportesDestacados();
  if (typeof actualizarEstadisticasHero === 'function') {
    await actualizarEstadisticasHero();
  }
}

/** Inicialización de reportes */
function initReportes() {
  if (formReporte) {
    formReporte.addEventListener('submit', manejarEnvioReporte);
  }

  refrescarSeccionReportes();

  suscribirReportesRealtime(refrescarSeccionReportes);
}

document.addEventListener('DOMContentLoaded', initReportes);
