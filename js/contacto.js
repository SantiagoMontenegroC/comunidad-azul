/**
 * contacto.js — Formulario de contacto → Supabase
 */

const formContacto = document.getElementById('form-contacto');
const msgContacto = document.getElementById('msg-contacto');

function mostrarMensajeContacto(tipo, texto) {
  if (!msgContacto) return;
  msgContacto.className = `form-message form-message--${tipo}`;
  msgContacto.textContent = texto;
  msgContacto.style.display = 'block';
}

async function manejarEnvioContacto(e) {
  e.preventDefault();
  if (!formContacto) return;

  const datos = {
    nombre: formContacto.nombre.value.trim(),
    email: formContacto.email.value.trim(),
    mensaje: formContacto.mensaje.value.trim(),
  };

  if (!datos.nombre || !datos.email || !datos.mensaje) {
    mostrarMensajeContacto('error', 'Por favor completa todos los campos.');
    return;
  }

  const btn = formContacto.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  const { error } = await enviarContacto(datos);

  btn.disabled = false;
  btn.textContent = 'Enviar Mensaje';

  if (error) {
    mostrarMensajeContacto('error', `Error al enviar: ${error.message}`);
    return;
  }

  mostrarMensajeContacto(
    'success',
    '¡Mensaje recibido! Te responderemos pronto.'
  );
  formContacto.reset();
}

function initContacto() {
  if (formContacto) {
    formContacto.addEventListener('submit', manejarEnvioContacto);
  }
}

document.addEventListener('DOMContentLoaded', initContacto);
