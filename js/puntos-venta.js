/**
 * puntos-venta.js — Google Maps + lista desde Supabase
 */

const puntosLista = document.getElementById('puntos-lista');
const mapaCanvas = document.getElementById('puntos-mapa-canvas');
const puntosMapaLeyenda = document.getElementById('puntos-mapa-leyenda');
const mapaAviso = document.getElementById('puntos-mapa-aviso');
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

const MAPA_CENTRO = { lat: 11.253335, lng: -74.170382 };
const MAPA_ZOOM_INICIAL = 17;

let puntosActuales = [];
let indiceSeleccionado = -1;
let googleMap = null;
let googleMarcadores = [];
let googleInfoVentana = null;
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

function obtenerApiKeyGoogle() {
  const key = typeof MAPS_CONFIG !== 'undefined' ? MAPS_CONFIG.apiKey : '';
  return (key || '').trim();
}

function mostrarAvisoMapa(mensaje) {
  if (!mapaAviso) return;
  mapaAviso.hidden = false;
  mapaAviso.textContent = mensaje;
}

function cargarScriptGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve();
      return;
    }
    const existente = document.querySelector('script[data-google-maps]');
    if (existente) {
      existente.addEventListener('load', () => resolve());
      existente.addEventListener('error', () => reject(new Error('No se pudo cargar Google Maps')));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&language=es`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Error al cargar la API de Google Maps'));
    document.head.appendChild(script);
  });
}

function iconoMarcadorGoogle(activo, seleccionado) {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: seleccionado ? 14 : 11,
    fillColor: activo ? '#00897B' : '#c62828',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: seleccionado ? 3 : 2,
  };
}

function initGoogleMap(puntos) {
  if (!mapaCanvas || !window.google?.maps) return false;

  googleMap = new google.maps.Map(mapaCanvas, {
    center: MAPA_CENTRO,
    zoom: MAPA_ZOOM_INICIAL,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: false,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
    ],
  });

  googleInfoVentana = new google.maps.InfoWindow();
  googleMarcadores = puntos.map((punto, index) => {
    const activo = estaActivo(punto);
    const marker = new google.maps.Marker({
      position: { lat: punto.lat, lng: punto.lng },
      map: googleMap,
      title: punto.nombre,
      icon: iconoMarcadorGoogle(activo, index === 0),
      zIndex: index === 0 ? 10 : 1,
    });

    marker.addListener('click', () => {
      seleccionarPunto(index);
    });

    return marker;
  });

  const bounds = new google.maps.LatLngBounds();
  puntos.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
  googleMap.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });

  google.maps.event.addListenerOnce(googleMap, 'idle', () => {
    if (googleMap.getZoom() > 18) googleMap.setZoom(18);
  });

  mapaListo = true;
  return true;
}

async function initMapaGoogle(puntos) {
  const apiKey = obtenerApiKeyGoogle();
  if (!apiKey) {
    mostrarAvisoMapa(
      'Para ver Google Maps, agrega tu API key en js/maps-config.js (Maps JavaScript API).'
    );
    mostrarEnlacesGoogleMaps(puntos);
    return false;
  }

  try {
    await cargarScriptGoogleMaps(apiKey);
    return initGoogleMap(puntos);
  } catch (err) {
    console.error(err);
    mostrarAvisoMapa(
      'No se pudo cargar Google Maps. Revisa la API key y que esté habilitada “Maps JavaScript API”.'
    );
    mostrarEnlacesGoogleMaps(puntos);
    return false;
  }
}

function mostrarEnlacesGoogleMaps(puntos) {
  if (!mapaCanvas) return;
  const links = puntos
    .map(
      (p) =>
        `<li><a href="https://www.google.com/maps?q=${p.lat},${p.lng}" target="_blank" rel="noopener noreferrer">${escaparHtml(p.nombre)}</a></li>`
    )
    .join('');
  mapaCanvas.innerHTML = `<div class="puntos-mapa__fallback"><p>Ubicaciones de tanques:</p><ul>${links}</ul></div>`;
}

function actualizarMarcadoresGoogle() {
  if (!googleMap || !googleMarcadores.length) return;

  googleMarcadores.forEach((marker, i) => {
    const activo = estaActivo(puntosActuales[i]);
    marker.setIcon(iconoMarcadorGoogle(activo, i === indiceSeleccionado));
    marker.setZIndex(i === indiceSeleccionado ? 20 : 1);
  });

  const punto = puntosActuales[indiceSeleccionado];
  if (!punto) return;

  googleMap.panTo({ lat: punto.lat, lng: punto.lng });
  if (googleMap.getZoom() < 17) googleMap.setZoom(17);

  if (googleInfoVentana) {
    const estado = estaActivo(punto) ? 'Abierto' : 'Cerrado';
    googleInfoVentana.setContent(
      `<div class="puntos-mapa__info"><strong>${escaparHtml(punto.nombre)}</strong><br>${estado}<br><small>${escaparHtml(punto.direccion)}</small></div>`
    );
    googleInfoVentana.open(googleMap, googleMarcadores[indiceSeleccionado]);
  }
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
    actualizarMarcadoresGoogle();
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
    puntosMapaLeyenda.textContent = `${activos} de ${puntos.length} tanques activos · Google Maps`;
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
          <a href="https://www.google.com/maps?q=${p.lat},${p.lng}" target="_blank" rel="noopener noreferrer">Ver en Google Maps</a>
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

async function renderizarPuntos(puntos) {
  puntosActuales = enriquecerPuntos(puntos);
  renderizarLista(puntosActuales);
  await initMapaGoogle(puntosActuales);
  if (puntosActuales.length > 0) {
    seleccionarPunto(0);
  }
}

function initZoomMapa() {
  if (!btnZoomIn || !btnZoomOut) return;

  btnZoomIn.addEventListener('click', () => {
    if (!googleMap) return;
    googleMap.setZoom(googleMap.getZoom() + 1);
  });

  btnZoomOut.addEventListener('click', () => {
    if (!googleMap) return;
    googleMap.setZoom(googleMap.getZoom() - 1);
  });
}

async function initPuntosVenta() {
  if (!puntosLista) return;

  initZoomMapa();
  mostrarSkeletonPuntos(3);

  const { data, error } = await cargarPuntosVenta();

  if (error) {
    const sinColumnas =
      error.message?.includes('lat') ||
      error.message?.includes('lng') ||
      error.code === '42703';

    if (sinColumnas) {
      const { data: dataBasica, error: err2 } = await getSupabase()
        .from('puntos_venta')
        .select('id, nombre, direccion, horario, precio, activo')
        .order('nombre', { ascending: true });

      if (!err2 && dataBasica) {
        await renderizarPuntos(dataBasica);
        return;
      }
    }

    puntosLista.innerHTML = `<p class="puntos-error glass-card">Error al cargar puntos: ${escaparHtml(error.message)}. Verifica tu conexión a Supabase.</p>`;
    if (puntosMapaLeyenda) puntosMapaLeyenda.textContent = 'Mapa no disponible';
    return;
  }

  await renderizarPuntos(data);
}

document.addEventListener('DOMContentLoaded', initPuntosVenta);
