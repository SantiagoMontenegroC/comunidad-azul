/**
 * puntos-venta.js — Mapa interactivo + lista desde Supabase
 */

const puntosLista = document.getElementById('puntos-lista');
const puntosMarcadores = document.getElementById('puntos-mapa-markers');
const puntosMapaImg = document.getElementById('puntos-mapa-img');
const puntosMapaLeyenda = document.getElementById('puntos-mapa-leyenda');
const mapaViewport = document.getElementById('puntos-mapa-viewport');
const btnZoomIn = document.getElementById('mapa-zoom-in');
const btnZoomOut = document.getElementById('mapa-zoom-out');

/** Mapa 3D de la pantalla Puntos de Venta (Stitch) */
const MAPA_PUNTOS_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAHqfoCOtF7Xc7NkCdObYap1D83nMEycereX0aeZCtU2OxTXDLpKksm2MXZEDusYA0coZ9Jwn4Lw-D9JesuR1gICealXr6VXIul5oeWO2t4fgBeasn0dy__VylOPj_c9y1cfAH_HOo8XhAlNWHQHgDquk5xsW-dfR4i9V3Wd5Vladx_6KR3p08Wsw4s_Rrqs6O0sDDFAeVtuLti9amPSPc93_LMtnaTjyjv3fkCtdgQcfaljTlkygbfge_BSa0LkRydHWZRvS_NKg';

const POSICIONES_POR_NOMBRE = [
  { match: /norte/i, top: 28, left: 26 },
  { match: /central/i, top: 44, left: 50 },
  { match: /sur/i, top: 68, left: 38 },
  { match: /plaza|manantial|cisterna/i, top: 52, left: 68 },
];

const POSICIONES_DEFAULT = [
  { top: 30, left: 28 },
  { top: 55, left: 62 },
  { top: 72, left: 40 },
  { top: 40, left: 72 },
  { top: 62, left: 22 },
];

let puntosActuales = [];
let indiceSeleccionado = -1;
let escalaMapa = 1;

function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

function obtenerPosicionMapa(punto, index) {
  const nombre = punto.nombre || '';
  for (const regla of POSICIONES_POR_NOMBRE) {
    if (regla.match.test(nombre)) {
      return { top: regla.top, left: regla.left };
    }
  }
  return POSICIONES_DEFAULT[index % POSICIONES_DEFAULT.length];
}

function estaActivo(punto) {
  return punto.activo !== false;
}

function porcentajeDisponibilidad(punto, index) {
  if (!estaActivo(punto)) return 0;
  const base = 55 + ((punto.id || index + 1) * 17) % 40;
  return Math.min(95, base);
}

function mostrarSkeletonPuntos(cantidad = 3) {
  if (!puntosLista) return;
  puntosLista.innerHTML = '';
  for (let i = 0; i < cantidad; i++) {
    const el = document.createElement('div');
    el.className = 'skeleton skeleton-card glass-card';
    puntosLista.appendChild(el);
  }
  if (puntosMarcadores) puntosMarcadores.innerHTML = '';
}

function seleccionarPunto(index) {
  indiceSeleccionado = index;

  document.querySelectorAll('.punto-marker').forEach((btn, i) => {
    btn.classList.toggle('punto-marker--selected', i === index);
    btn.classList.toggle('punto-marker--pulse', i === index);
  });

  document.querySelectorAll('.punto-card').forEach((card, i) => {
    card.classList.toggle('punto-card--selected', i === index);
  });
}

function renderizarMarcadores(puntos) {
  if (!puntosMarcadores) return;

  puntosMarcadores.innerHTML = puntos
    .map((p, i) => {
      const pos = obtenerPosicionMapa(p, i);
      const activo = estaActivo(p);
      const estado = activo ? 'Abierto' : 'Cerrado';
      return `
        <button
          type="button"
          class="punto-marker ${activo ? 'punto-marker--activo' : 'punto-marker--inactivo'}${i === 0 ? ' punto-marker--pulse' : ''}"
          style="top:${pos.top}%;left:${pos.left}%"
          data-index="${i}"
          aria-label="${escaparHtml(p.nombre)} — ${estado}"
        >
          <span class="punto-marker__pin">
            <span class="material-symbols-outlined material-symbols-outlined--fill">location_on</span>
          </span>
          <span class="punto-marker__tooltip">${escaparHtml(p.nombre)} (${estado})</span>
        </button>
      `;
    })
    .join('');

  puntosMarcadores.querySelectorAll('.punto-marker').forEach((btn) => {
    btn.addEventListener('click', () => {
      seleccionarPunto(Number(btn.dataset.index));
    });
  });
}

function renderizarLista(puntos) {
  if (!puntosLista) return;

  if (!puntos || puntos.length === 0) {
    puntosLista.innerHTML =
      '<p class="puntos-empty glass-card">No hay puntos de venta registrados por el momento.</p>';
    if (puntosMapaLeyenda) {
      puntosMapaLeyenda.textContent = 'Sin puntos en el mapa';
    }
    return;
  }

  const activos = puntos.filter((p) => estaActivo(p)).length;
  if (puntosMapaLeyenda) {
    puntosMapaLeyenda.textContent = `${activos} de ${puntos.length} puntos activos en el barrio`;
  }

  puntosLista.innerHTML = puntos
    .map((p, i) => {
      const activo = estaActivo(p);
      const pct = porcentajeDisponibilidad(p, i);
      return `
    <article
      class="punto-card glass-card fade-in visible ${activo ? '' : 'punto-card--inactivo'}"
      data-index="${i}"
      tabindex="0"
      role="button"
      aria-pressed="false"
    >
      <div class="punto-card__top">
        <h3 class="punto-card__nombre">${escaparHtml(p.nombre)}</h3>
        <span class="punto-card__estado ${activo ? 'punto-card__estado--activo' : 'punto-card__estado--inactivo'}">
          ${activo ? 'Abierto' : 'Cerrado'}
        </span>
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
      </div>
      <div class="punto-card__barra">
        <div class="punto-card__barra-label">
          <span>Disponibilidad estimada</span>
          <strong>${activo ? `${pct}%` : 'Sin suministro'}</strong>
        </div>
        <div class="punto-card__barra-track" role="presentation">
          <div class="punto-card__barra-fill" style="width:${pct}%"></div>
        </div>
      </div>
      <p class="punto-card__precio">${escaparHtml(p.precio || 'Precio no disponible')}</p>
    </article>
  `;
    })
    .join('');

  puntosLista.querySelectorAll('.punto-card').forEach((card) => {
    const index = Number(card.dataset.index);
    const activar = () => seleccionarPunto(index);
    card.addEventListener('click', activar);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activar();
      }
    });
  });
}

function renderizarPuntos(puntos) {
  puntosActuales = puntos || [];
  renderizarMarcadores(puntosActuales);
  renderizarLista(puntosActuales);
  if (puntosActuales.length > 0) {
    seleccionarPunto(0);
  }
}

function aplicarZoomMapa() {
  if (!puntosMapaImg) return;
  puntosMapaImg.style.transform = `scale(${escalaMapa})`;
}

function initZoomMapa() {
  if (!btnZoomIn || !btnZoomOut) return;

  btnZoomIn.addEventListener('click', () => {
    escalaMapa = Math.min(2, escalaMapa + 0.15);
    aplicarZoomMapa();
  });

  btnZoomOut.addEventListener('click', () => {
    escalaMapa = Math.max(1, escalaMapa - 0.15);
    aplicarZoomMapa();
  });
}

function initImagenMapa() {
  if (!puntosMapaImg) return;

  puntosMapaImg.addEventListener(
    'error',
    () => {
      if (!puntosMapaImg.src.includes('img/stitch/mapa-suministro')) {
        puntosMapaImg.src = 'img/stitch/mapa-suministro.jpg';
      }
    },
    { once: true }
  );

  const imgStitch = new Image();
  imgStitch.onload = () => {
    puntosMapaImg.src = MAPA_PUNTOS_URL;
  };
  imgStitch.onerror = () => {
    puntosMapaImg.src = 'img/stitch/mapa-suministro.jpg';
  };
  imgStitch.src = MAPA_PUNTOS_URL;
}

async function initPuntosVenta() {
  if (!puntosLista) return;

  initImagenMapa();
  initZoomMapa();
  mostrarSkeletonPuntos(3);

  const { data, error } = await cargarPuntosVenta();

  if (error) {
    puntosLista.innerHTML = `<p class="puntos-error glass-card">Error al cargar puntos: ${escaparHtml(error.message)}. Verifica tu conexión a Supabase.</p>`;
    if (puntosMapaLeyenda) puntosMapaLeyenda.textContent = 'Mapa no disponible';
    return;
  }

  renderizarPuntos(data);
}

document.addEventListener('DOMContentLoaded', initPuntosVenta);
