/**
 * puntos-venta.js — Mapa OpenStreetMap (Leaflet) + lista desde Supabase
 * Gratis: sin API key ni tarjeta.
 */

const puntosLista = document.getElementById('puntos-lista');
const puntosMapa = document.getElementById('puntos-mapa');
const mapaCanvas = document.getElementById('puntos-mapa-canvas');
const puntosMapaLeyenda = document.getElementById('puntos-mapa-leyenda');
const btnZoomIn = document.getElementById('mapa-zoom-in');
const btnZoomOut = document.getElementById('mapa-zoom-out');

/** Tanques en Barrio Divino Niño 1 (lat, lng) */
const TANQUES_COORDENADAS = {
  'Punto Norte': { lat: 11.254994918626378, lng: -74.17079120137323 },
  'Punto Sur': { lat: 11.251916597415095, lng: -74.16874979210517 },
  'Punto Central': { lat: 11.253092870380645, lng: -74.17160776508045 },
};

const TANQUES_COORDENADAS_ORDEN = [
  { lat: 11.254994918626378, lng: -74.17079120137323 },
  { lat: 11.251916597415095, lng: -74.16874979210517 },
  { lat: 11.253092870380645, lng: -74.17160776508045 },
];

const MAPA_CENTRO = [11.253335, -74.170382];
const MAPA_ZOOM_INICIAL = 17;

let puntosActuales = [];
let indiceSeleccionado = -1;
let mapaLeaflet = null;
let marcadoresLeaflet = [];
let mapaListo = false;

function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

function resolverCoordenadas(punto, index) {
  if (punto.lat != null && punto.lng != null && !Number.isNaN(Number(punto.lat))) {
    return { lat: Number(punto.lat), lng: Number(punto.lng) };
  }
  if (TANQUES_COORDENADAS[punto.nombre]) {
    return TANQUES_COORDENADAS[punto.nombre];
  }
  return TANQUES_COORDENADAS_ORDEN[index % TANQUES_COORDENADAS_ORDEN.length];
}

function enriquecerPuntos(puntos) {
  return (puntos || []).map((p, i) => ({
    ...p,
    ...resolverCoordenadas(p, i),
  }));
}

function estaActivo(punto) {
  return punto.activo !== false;
}

function porcentajeDisponibilidad(punto, index) {
  if (!estaActivo(punto)) return 0;
  const base = 55 + ((punto.id || index + 1) * 17) % 40;
  return Math.min(95, base);
}

function enlaceUbicacion(punto) {
  return `https://www.openstreetmap.org/?mlat=${punto.lat}&mlon=${punto.lng}#map=18/${punto.lat}/${punto.lng}`;
}

function crearIconoMarcador(activo, seleccionado) {
  const color = activo ? '#00897B' : '#c62828';
  const tam = seleccionado ? 42 : 36;
  return L.divIcon({
    className: 'punto-marker-leaflet',
    html: `
      <span class="punto-marker-leaflet__pin${seleccionado ? ' punto-marker-leaflet__pin--selected' : ''}"
        style="width:${tam}px;height:${tam}px;background:${color}">
        <span class="material-symbols-outlined material-symbols-outlined--fill">water_drop</span>
      </span>
    `,
    iconSize: [tam, tam],
    iconAnchor: [tam / 2, tam],
    popupAnchor: [0, -tam],
  });
}

function initMapaLeaflet(puntos) {
  if (!mapaCanvas || typeof L === 'undefined') return false;

  if (mapaLeaflet) {
    mapaLeaflet.remove();
    mapaLeaflet = null;
    marcadoresLeaflet = [];
  }

  mapaLeaflet = L.map(mapaCanvas, {
    scrollWheelZoom: true,
    zoomControl: false,
  }).setView(MAPA_CENTRO, MAPA_ZOOM_INICIAL);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
  }).addTo(mapaLeaflet);

  const bounds = L.latLngBounds();

  marcadoresLeaflet = puntos.map((punto, index) => {
    const activo = estaActivo(punto);
    const marker = L.marker([punto.lat, punto.lng], {
      icon: crearIconoMarcador(activo, index === 0),
      title: punto.nombre,
    }).addTo(mapaLeaflet);

    const estado = activo ? 'Abierto' : 'Cerrado';
    marker.bindPopup(
      `<div class="puntos-mapa__info"><strong>${escaparHtml(punto.nombre)}</strong><br>${estado}<br><small>${escaparHtml(punto.direccion)}</small></div>`
    );

    marker.on('click', () => seleccionarPunto(index));
    bounds.extend([punto.lat, punto.lng]);
    return marker;
  });

  if (puntos.length > 1) {
    mapaLeaflet.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
  }

  setTimeout(() => mapaLeaflet.invalidateSize(), 100);
  mapaListo = true;
  return true;
}

function actualizarMarcadoresLeaflet() {
  if (!mapaLeaflet || !marcadoresLeaflet.length) return;

  marcadoresLeaflet.forEach((marker, i) => {
    const activo = estaActivo(puntosActuales[i]);
    marker.setIcon(crearIconoMarcador(activo, i === indiceSeleccionado));
    if (i === indiceSeleccionado) {
      marker.setZIndexOffset(1000);
    } else {
      marker.setZIndexOffset(0);
    }
  });

  const punto = puntosActuales[indiceSeleccionado];
  if (!punto) return;

  mapaLeaflet.setView([punto.lat, punto.lng], Math.max(mapaLeaflet.getZoom(), 17), { animate: true });
  marcadoresLeaflet[indiceSeleccionado].openPopup();
}

function mostrarSkeletonPuntos(cantidad = 3) {
  if (!puntosLista) return;
  puntosLista.innerHTML = '';
  for (let i = 0; i < cantidad; i++) {
    const el = document.createElement('div');
    el.className = 'skeleton skeleton-card glass-card';
    puntosLista.appendChild(el);
  }
}

function seleccionarPunto(index) {
  if (index < 0 || index >= puntosActuales.length) return;
  indiceSeleccionado = index;

  document.querySelectorAll('.punto-card').forEach((card, i) => {
    card.classList.toggle('punto-card--selected', i === index);
    card.setAttribute('aria-pressed', i === index ? 'true' : 'false');
  });

  if (mapaListo) {
    actualizarMarcadoresLeaflet();
  }
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
    puntosMapaLeyenda.textContent = `${activos} de ${puntos.length} tanques activos en el barrio`;
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
        <div class="punto-card__row punto-card__row--coords">
          <span class="material-symbols-outlined">map</span>
          <a href="${enlaceUbicacion(p)}" target="_blank" rel="noopener noreferrer">Ver ubicación en el mapa</a>
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
    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      activar();
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activar();
      }
    });
  });
}

/** En escritorio, el mapa iguala la altura de la columna de tarjetas */
function sincronizarAlturaMapa() {
  if (!puntosMapa || !puntosLista || window.innerWidth < 1024) {
    if (puntosMapa) puntosMapa.style.height = '';
    return;
  }

  puntosMapa.style.height = `${puntosLista.offsetHeight}px`;

  if (mapaLeaflet) {
    requestAnimationFrame(() => mapaLeaflet.invalidateSize());
  }
}

function renderizarPuntos(puntos) {
  puntosActuales = enriquecerPuntos(puntos);
  renderizarLista(puntosActuales);
  initMapaLeaflet(puntosActuales);
  if (puntosActuales.length > 0) {
    seleccionarPunto(0);
  }
  requestAnimationFrame(() => {
    sincronizarAlturaMapa();
    setTimeout(sincronizarAlturaMapa, 150);
  });
}

function initZoomMapa() {
  if (!btnZoomIn || !btnZoomOut) return;

  btnZoomIn.addEventListener('click', () => {
    if (!mapaLeaflet) return;
    mapaLeaflet.zoomIn();
  });

  btnZoomOut.addEventListener('click', () => {
    if (!mapaLeaflet) return;
    mapaLeaflet.zoomOut();
  });
}

async function initPuntosVenta() {
  if (!puntosLista) return;

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
window.addEventListener('resize', sincronizarAlturaMapa);
