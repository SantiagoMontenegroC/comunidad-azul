"""
Captura cada sección del sitio para documentación del blog.
Uso: py scripts/capturar-blog.py [url]
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "blog-capturas"
URL_DEFAULT = "https://comunidad-azul.netlify.app"

SECCIONES = [
    ("01-navbar", "#navbar", False),
    ("02-inicio-hero", "#inicio .hero", False),
    ("03-inicio-info", ".hero-info", False),
    ("04-puntos-venta", "#puntos-venta", False),
    ("05-reportes", "#reportes", False),
    ("06-contacto", "#contacto", False),
    ("07-footer", ".site-footer", False),
    ("00-pagina-completa", "body", True),
]


def main() -> int:
    url = sys.argv[1] if len(sys.argv) > 1 else URL_DEFAULT
    OUT.mkdir(parents=True, exist_ok=True)

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Instala Playwright: py -m pip install playwright && py -m playwright install chromium")
        return 1

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.goto(url, wait_until="networkidle", timeout=90_000)
        page.wait_for_timeout(2500)

        for nombre, selector, full_page in SECCIONES:
            path = OUT / f"{nombre}.png"
            if full_page:
                page.screenshot(path=str(path), full_page=True)
            else:
                loc = page.locator(selector).first
                loc.wait_for(state="visible", timeout=15_000)
                loc.screenshot(path=str(path))
            print(f"OK {path.name}")

        browser.close()

    readme = OUT / "README.md"
    readme.write_text(
        f"""# Capturas para el blog — Comunidad Azul

Generadas desde: `{url}`

| Archivo | Sección |
|---------|---------|
| `00-pagina-completa.png` | Vista completa del sitio |
| `01-navbar.png` | Barra de navegación |
| `02-inicio-hero.png` | Hero (inicio) |
| `03-inicio-info.png` | Tarjetas de acción comunitaria |
| `04-puntos-venta.png` | Mapa y puntos de venta |
| `05-reportes.png` | Reportes comunitarios |
| `06-contacto.png` | Contacto |
| `07-footer.png` | Pie de página |

## Volver a generar

```powershell
py -m pip install playwright
py -m playwright install chromium
py scripts/capturar-blog.py
```

## MCP en Cursor (Playwright)

Configurado en `.cursor/mcp.json`. Tras instalar [Node.js LTS](https://nodejs.org/), reinicia Cursor y usa herramientas como `browser_take_screenshot` apuntando a `docs/blog-capturas/mcp/`.
""",
        encoding="utf-8",
    )
    print(f"Listo: {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
