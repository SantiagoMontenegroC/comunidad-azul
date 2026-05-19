# Comunidad Azul

Sitio web comunitario sobre la problemática del agua en el **Barrio Divino Niño 1**, Colombia. Proyecto universitario con base de datos real en **Supabase**.

## Estructura del proyecto

```
comunidad-azul/
├── index.html
├── css/
│   ├── styles.css
│   ├── navbar.css
│   ├── inicio.css
│   ├── puntos-venta.css
│   ├── reportes.css
│   └── contacto.css
├── js/
│   ├── supabase.js
│   ├── main.js
│   ├── puntos-venta.js
│   ├── reportes.js
│   └── contacto.js
├── img/                 ← Coloca aquí tus imágenes locales
├── supabase/
│   └── schema.sql
└── README.md
```

## Requisitos

- Cuenta gratuita en [Supabase](https://supabase.com)
- Cuenta gratuita en [Netlify](https://netlify.com) (para despliegue)
- Navegador moderno

## Conectar Supabase (paso a paso)

### 1. Crear proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) e inicia sesión.
2. **New project** → elige nombre (ej. `comunidad-azul`) y contraseña de BD.
3. Espera a que el proyecto termine de crearse.

### 2. Ejecutar el SQL

1. En el panel izquierdo: **SQL Editor** → **New query**.
2. Copia y pega todo el contenido de `supabase/schema.sql`.
3. Pulsa **Run**. Debes ver las 3 tablas creadas y 3 filas de prueba en `puntos_venta`.

### 3. Habilitar Realtime (reportes en vivo)

1. Ve a **Database** → **Replication**.
2. Activa la tabla **`reportes`** para que el feed se actualice en tiempo real.

### 4. Copiar credenciales API

1. **Settings** → **API**.
2. Copia:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_KEY`

### 5. Configurar el sitio

Abre `js/supabase.js` y reemplaza:

```javascript
const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_KEY = 'tu-anon-key-aqui';
```

### 6. Probar en local

Abre `index.html` con un servidor local (recomendado, para evitar problemas CORS):

```bash
# Con Python
cd comunidad-azul
python -m http.server 5500
```

Luego visita: `http://localhost:5500`

O usa la extensión **Live Server** de VS Code/Cursor.

---

## Desplegar en Netlify (paso a paso)

### Opción A — Arrastrar carpeta (más rápida)

1. Entra a [app.netlify.com](https://app.netlify.com).
2. Arrastra la carpeta `comunidad-azul` a la zona **“Drag and drop”**.
3. Netlify te dará una URL tipo `https://nombre-random.netlify.app`.
4. Listo: el sitio ya está en línea.

### Opción B — Desde GitHub (recomendada para el proyecto)

1. Sube el proyecto a un repositorio en GitHub.
2. En Netlify: **Add new site** → **Import an existing project**.
3. Conecta GitHub y selecciona el repositorio.
4. Configuración de build:
   - **Build command:** (dejar vacío)
   - **Publish directory:** `/` o `.` (raíz del repo)
5. **Deploy site**.

### Después del despliegue

- Verifica que `js/supabase.js` tenga las credenciales correctas **antes** de subir (o usa variables de entorno si migras a un build más avanzado).
- En Supabase → **Authentication** → **URL Configuration**, puedes agregar tu URL de Netlify si usas auth en el futuro.

---

## Funciones de Supabase usadas

| Función | Descripción |
|---------|-------------|
| `cargarPuntosVenta()` | SELECT puntos activos |
| `enviarReporte(datos)` | INSERT en `reportes` |
| `cargarReportes()` | Últimos 10 reportes |
| `enviarContacto(datos)` | INSERT en `contactos` |
| `suscribirReportesRealtime()` | Actualización en vivo del feed |

---

## Paleta de colores

| Variable | Hex |
|----------|-----|
| Azul profundo | `#0A2A5E` |
| Azul medio | `#1E88E5` |
| Teal | `#00BCD4` |
| Azul claro | `#E3F2FD` |
| Alerta | `#FF6B35` |

---

## Créditos

- Diseño visual base: **Google Stitch** (Comunidad Azul)
- Tipografías: Raleway, Nunito (Google Fonts)
- Backend: Supabase

**Barrio Divino Niño 1 — Colombia © 2025**
