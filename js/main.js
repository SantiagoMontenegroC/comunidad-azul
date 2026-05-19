/**
 * main.js — Navbar, scroll suave, fade-in, hero
 */

/** Navbar: glassmorphism al hacer scroll + menú hamburguesa */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  const links = document.querySelectorAll('.navbar__link');

  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('navbar--scrolled', window.scrollY > 50);
    });
  }

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const abierto = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', abierto);
    });

    links.forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /** Resalta el enlace de la sección visible */
  const secciones = document.querySelectorAll('section[id]');
  const observerNav = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          links.forEach((l) => {
            l.classList.toggle(
              'navbar__link--active',
              l.getAttribute('href') === `#${id}`
            );
          });
        }
      });
    },
    { rootMargin: '-40% 0px -50% 0px' }
  );

  secciones.forEach((s) => observerNav.observe(s));
}

/** Fade-in al hacer scroll (IntersectionObserver) */
function initFadeIn() {
  const elementos = document.querySelectorAll('.fade-in:not(.visible)');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  elementos.forEach((el) => observer.observe(el));
}

/** Botones del hero que llevan a otras secciones */
function initHeroButtons() {
  const btnSuministro = document.getElementById('btn-estado-suministro');
  const btnProyecto = document.getElementById('btn-conoce-proyecto');

  btnSuministro?.addEventListener('click', () => {
    document.getElementById('puntos-venta')?.scrollIntoView({ behavior: 'smooth' });
  });

  btnProyecto?.addEventListener('click', () => {
    document.querySelector('.hero-info')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelectorAll('[data-scroll]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.dataset.scroll);
      target?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/** Indicador de conexión con Supabase (reportes) */
function actualizarIndicadorBD(conectado) {
  const ind = document.getElementById('db-indicator');
  if (!ind) return;

  const label = ind.querySelector('.db-indicator__label');
  ind.classList.toggle('db-indicator--offline', !conectado);
  if (label) {
    label.textContent = conectado
      ? 'Conectado a la base de datos'
      : 'Sin conexión a la base de datos';
  }
}

/** Sincroniza tarjetas del hero con datos reales de Supabase */
async function actualizarEstadisticasHero() {
  const puntosEl = document.getElementById('hero-puntos-count');
  const reportesEl = document.getElementById('hero-reportes-count');
  const badgeEl = document.getElementById('hero-reportes-badge');

  const { data: puntos, error: errPuntos } = await cargarPuntosVenta();
  if (!errPuntos && puntosEl && puntos) {
    puntosEl.textContent = String(puntos.length).padStart(2, '0');
  }

  const { data: reportes, error: errReportes } = await cargarReportes();
  if (!errReportes && reportesEl && reportes) {
    const enSeguimiento = reportes.filter(
      (r) => !(r.estado || '').toLowerCase().includes('resuelto')
    ).length;
    reportesEl.textContent = String(enSeguimiento).padStart(2, '0');
    if (badgeEl) {
      badgeEl.textContent = enSeguimiento === 0 ? 'Sin pendientes' : 'En curso';
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const cliente = initSupabase();
  actualizarIndicadorBD(!!cliente);
  initNavbar();
  initFadeIn();
  initHeroButtons();
  if (cliente) {
    await actualizarEstadisticasHero();
  }
});
