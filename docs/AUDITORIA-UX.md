# Auditoría UX/UI y de Seguridad — Vidriería A&E Cajusol H

Fecha: junio 2026 · Alcance: `index.html`, `css/style.css`, `site-config.js`, extranet.

---

## 1. Hallazgos (estado anterior)

### Impacto ALTO

| # | Problema | Principio vulnerado |
|---|----------|---------------------|
| A1 | **No existía `js/main.js`**: stats, servicios, galería, proceso y contacto quedaban vacíos (el HTML los marca como "generado por JS"). | Funcionalidad básica — el sitio estaba roto. |
| A2 | Textos sobre azul con opacidad ≤ 0.65 (`hero-badge`, `stat-label`, footer 0.45): ratios de contraste de 2.1–3.4:1. | WCAG 1.4.3 — contraste mínimo AA 4.5:1. |
| A3 | Galería operable solo con mouse (`div` + hover) y overlay hover-only: invisible en táctil e inalcanzable por teclado. | WCAG 2.1.1 (teclado) y diseño táctil. |
| A4 | Lightbox sin `role="dialog"`, sin Esc/flechas, sin gestión de foco. | WCAG 2.4.3 / ARIA dialog pattern. |
| A5 | La "extranet" no tenía autenticación real (login estático + localStorage): cualquiera podía editar el sitio. | OWASP A01/A07 — control de acceso roto. |
| A6 | `margin-left: calc((100vw - 1200px)/2)` en el hero usa `100vw` (incluye scrollbar) → scroll horizontal en desktop. | Layout robusto / no overflow. |
| A7 | Imágenes dinámicas sin `alt`, sin `loading="lazy"`, sin `width/height` (CLS alto, carga lenta en 4G). | WCAG 1.1.1, Core Web Vitals (CLS/LCP). |

### Impacto MEDIO

| # | Problema | Principio |
|---|----------|-----------|
| M1 | Sin `:focus-visible` global; foco invisible en botones/links sobre fondo azul. | WCAG 2.4.7 — foco visible. |
| M2 | Hamburguesa sin `aria-expanded`/`aria-controls`; menú móvil sin cierre con Esc. | ARIA disclosure pattern. |
| M3 | Tipografías base de 12–13px en cuerpo (`.service-desc`, `.nav-link`): por debajo de 16px en móvil provoca zoom iOS y fatiga lectora. | Legibilidad móvil. |
| M4 | Radios de borde inconsistentes (10, 12, 18, 20, 25, 50px) y transiciones `all 0.3s`. | Consistencia visual / performance de animación. |
| M5 | Botones y filtros < 44px de alto (filtros 33px, topbar links 22px). | Touch target ≥ 44px (Apple HIG / Material). |
| M6 | Sin metadatos OG/Twitter ni datos estructurados; el título no comunica servicios. | SEO básico / shareability. |
| M7 | Formulario sin validación accesible (`aria-invalid`, mensajes con `role=status`), botón "Enviar" sin acción real. | Prevención de errores (Nielsen #5/#9). |
| M8 | Teléfonos/email como texto plano, no como `tel:`/`mailto:`. | Eficiencia de uso en móvil. |
| M9 | CSS muerto: `.hero-trust-*`, `.hero-features`, `.section-blue`, peso de fuentes 900 no usado. | Performance (payload). |

### Impacto BAJO

| # | Problema | Principio |
|---|----------|-----------|
| B1 | Animaciones sin `prefers-reduced-motion`. | WCAG 2.3.3. |
| B2 | `iframe` del mapa sin `title`. | WCAG 4.1.2. |
| B3 | Enlace de Facebook visible apuntando a `#` (config vacía). | No mostrar acciones muertas. |
| B4 | Año del footer fijo en 2025. | Mantenibilidad. |
| B5 | Lista del proceso como `div` en vez de `<ol>` (es una secuencia). | HTML semántico. |

---

## 2. Cambios aplicados

### Identidad visual y estética
- **Design tokens** en `:root`: paleta (primario/acento/amarillo/neutros), 2 fuentes (Bebas Neue títulos + Montserrat cuerpo), escala tipográfica `--fs-h1…--fs-caption` con `clamp()`, espaciado base 4px (`--sp-1…--sp-16`), radios estandarizados (8px inputs/botones, 12px cards, pill solo CTAs), sombras solo para elevación.
- **Contraste AA**: tokens `--on-blue` (0.92) y `--on-blue-muted` (0.80) sobre azul; `--text-muted` oscurecido a `#5B6472` (5.9:1); `--yellow-dark` corregido a `#8A6D00` para texto amarillo sobre blanco; footer sobre `--blue-dark`.
- **Microanimaciones 0.2s ease** con propiedades específicas (no `transition: all`).
- Más white space: `--sp-section` fluido (60–96px), headers de sección a 56px.

### Responsive y mobile-first
- Hero re-maquetado con contenedor centrado (elimina el `calc(100vw…)` → sin overflow horizontal).
- Body a 16px; botones y controles con `min-height: 44px`.
- Overlay de galería siempre visible en táctil (`@media (hover: none)`).
- CTAs del hero a ancho completo en ≤480px; padding lateral reducido a 16px en móvil.
- Inputs con tipo correcto: `tel` + `inputmode`, `autocomplete`.

### Accesibilidad
- Skip link, `<header>/<main>/<footer>`, secciones con `aria-labelledby`, proceso como `<ol>`.
- `:focus-visible` global (anillo azul; amarillo sobre fondos oscuros).
- Galería: ítems `<button>` con `aria-label`; filtros con `aria-pressed`.
- Lightbox: `role="dialog"`, `aria-modal`, Esc/←/→, trampa de foco y retorno de foco.
- Menú móvil: `aria-expanded`, `aria-controls`, cierre con Esc.
- Formulario: validación con `aria-invalid`, mensajes `role="status"`, foco al primer error.
- `alt` descriptivo generado desde la config; emojis decorativos con `aria-hidden`.
- `prefers-reduced-motion` desactiva animaciones y contadores.

### Performance y SEO
- `loading="lazy"`, `decoding="async"`, `width/height` en todas las imágenes dinámicas.
- Scripts con `defer`; peso de fuente 900 eliminado de Google Fonts.
- CSS muerto eliminado (~80 líneas).
- Meta description, OG/Twitter cards, `theme-color`, JSON-LD `LocalBusiness`.
- Reveal-on-scroll e IntersectionObserver propios (sin librerías externas).
- Pendiente (requiere las imágenes originales): convertir `Imagenes/*.jpg` a WebP comprimido y generar `srcset`.

### Seguridad de la extranet (nuevo backend `server/`)
- JWT de acceso (15 min configurables) + **refresh token rotativo** en cookie `HttpOnly; Secure; SameSite=Strict`.
- **CSRF double-submit** (cookie + header `X-CSRF-Token`) en POST/PUT/DELETE.
- **Rate limiting**: 5 intentos de login / 10 min por IP (429 + auditoría).
- Contraseña con **bcrypt, 12 salt rounds** (`npm run hash-password`); secretos solo por variables de entorno.
- Validación/sanitización de todos los inputs en servidor (regex de color/teléfono/email/URL, strip de HTML y caracteres de control, límites de longitud).
- Middleware de auth con **401/403 correctos**; rutas `/server` y `/api/*` desconocidas devuelven 404.
- Headers vía helmet: **CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, HSTS**.
- **Log de auditoría** (`server/logs/audit.log`): logins fallidos/exitosos, rate-limit, CSRF rechazado, cambios de config.
- Sin endpoints de depuración; `x-powered-by` deshabilitado; `.env`, logs y datos excluidos de git.
