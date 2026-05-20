/**
 * Captura cada sección del sitio para el blog.
 * Uso: node scripts/capturar-blog.mjs [url]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'docs', 'blog-capturas');
const URL = process.argv[2] || 'https://comunidad-azul.netlify.app';

const SECCIONES = [
  ['01-navbar', '#navbar', false],
  ['02-inicio-hero', '#inicio .hero', false],
  ['03-inicio-info', '.hero-info', false],
  ['04-puntos-venta', '#puntos-venta', false],
  ['05-reportes', '#reportes', false],
  ['06-contacto', '#contacto', false],
  ['07-footer', '.site-footer', false],
  ['00-pagina-completa', 'body', true],
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(URL, { waitUntil: 'networkidle', timeout: 90_000 });
await page.waitForTimeout(3000);

for (const [nombre, selector, fullPage] of SECCIONES) {
  const path = join(OUT, `${nombre}.png`);
  if (fullPage) {
    await page.screenshot({ path, fullPage: true });
  } else {
    const el = page.locator(selector).first();
    await el.waitFor({ state: 'visible', timeout: 15_000 });
    await el.screenshot({ path });
  }
  console.log('OK', nombre);
}

await browser.close();

const readme = `# Capturas para el blog — Comunidad Azul

Generadas desde: \`${URL}\`

| Archivo | Sección |
|---------|---------|
| \`00-pagina-completa.png\` | Vista completa |
| \`01-navbar.png\` | Navegación |
| \`02-inicio-hero.png\` | Hero |
| \`03-inicio-info.png\` | Acción comunitaria |
| \`04-puntos-venta.png\` | Mapa y puntos |
| \`05-reportes.png\` | Reportes |
| \`06-contacto.png\` | Contacto |
| \`07-footer.png\` | Footer |

## Regenerar

\`\`\`powershell
cd comunidad-azul
npm install
npx playwright install chromium
npm run capturas:blog
\`\`\`
`;

await writeFile(join(OUT, 'README.md'), readme, 'utf8');
console.log('Listo:', OUT);
