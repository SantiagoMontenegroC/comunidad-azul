/**
 * puntos-venta.js — Carga dinámica de puntos desde Supabase
 */

const puntosGrid = document.getElementById('puntos-grid');

/** Muestra tarjetas skeleton mientras cargan los datos */
function mostrarSkeletonPuntos(cantidad = 3) {
  if (!puntosGrid) return;
  puntosGrid.innerHTML = '';
  for (let i = 0; i < cantidad; i++) {
    const el = document.createElement('div');
    el.className = 'skeleton skeleton-card glass-card';
    puntosGrid.appendChild(el);
  }
}

/** Renderiza las tarjetas con datos reales */
function renderizarPuntos(puntos) {
  if (!puntosGrid) return;

  if (!puntos || puntos.length === 0) {
    puntosGrid.innerHTML =
      '<p class="puntos-empty">No hay puntos de venta registrados por el momento.</p>';
    return;
  }

  puntosGrid.innerHTML = puntos
    .map(
      (p) => `
    <article class="punto-card glass-card fade-in visible">
      <div class="punto-card__header">
        <h3 class="punto-card__nombre">${escaparHtml(p.nombre)}</h3>
        <span class="material-symbols-outlined material-symbols-outlined--fill" style="color: var(--teal)">water_drop</span>
      </div>
      <div class="punto-card__meta">
        <div class="punto-card__row">
          <span class="material-symbols-outlined">location_on</span>
          <span>${escaparHtml(p.direccion)}</span>
        </div>
        <div class="punto-card__row">
          <span class="material-symbols-outlined">schedule</span>
          <span>${escaparHtml(p.horario || 'Consultar horario')}</span>
        </div>
        <p class="punto-card__precio">${escaparHtml(p.precio || 'Precio no disponible')}</p>
      </div>
    </article>
  `
    )
    .join('');
}

/** Evita inyección XSS en datos de la BD */
function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

/** Carga puntos desde Supabase */
async function initPuntosVenta() {
  if (!puntosGrid) return;

  mostrarSkeletonPuntos(3);

  const { data, error } = await cargarPuntosVenta();

  if (error) {
    puntosGrid.innerHTML = `<p class="puntos-error">Error al cargar puntos: ${escaparHtml(error.message)}. Verifica tu conexión a Supabase.</p>`;
    return;
  }

  renderizarPuntos(data);
}

document.addEventListener('DOMContentLoaded', initPuntosVenta);
