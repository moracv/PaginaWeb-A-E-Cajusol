# Vidriería A&E Cajusol H — Sitio web

Sitio web de Vidriería A&E Cajusol H (Lambayeque, Perú): ventanas y puertas de
aluminio, drywall, melamine, estructuras de acero y fachadas comerciales.

## Estructura

```
index.html          Página principal (estática, funciona sin servidor)
css/style.css       Estilos con design tokens (WCAG AA, mobile-first)
js/main.js          Renderiza el contenido dinámico desde site-config.js
site-config.js      Contenido editable (textos, colores, servicios, galería)
Imagenes/           Fotos del sitio (agregar aquí los .jpg/.webp)
extranet/           Panel de administración (login + editor de contenido)
server/             Backend Node/Express: estáticos + API segura de la extranet
docs/AUDITORIA-UX.md  Auditoría UX/UI y de seguridad con los cambios aplicados
```

> **Importante:** la carpeta `Imagenes/` debe contener las fotos referenciadas
> en `site-config.js`. Para mejor rendimiento, conviértelas a WebP y comprímelas
> (por ejemplo con [squoosh.app](https://squoosh.app)).

## Sitio público

Es 100% estático: puede servirse desde GitHub Pages o cualquier hosting.
El formulario de contacto envía la solicitud por WhatsApp (no requiere backend).

## Extranet (panel de administración)

La extranet **requiere el servidor Node** (la autenticación se hace en el
servidor; un sitio estático no puede proteger un panel de administración).

### Puesta en marcha

```bash
cd server
npm install
cp .env.example .env

# 1. Generar el secreto JWT
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
#    → pegar el resultado en JWT_SECRET de .env

# 2. Generar el hash de la contraseña de administrador
npm run hash-password
#    → pegar la línea ADMIN_PASSWORD_HASH en .env

# 3. Arrancar
npm start          # producción (exige .env completo y cookies Secure)
npm run dev        # desarrollo
```

El sitio queda en `http://localhost:3000` y la extranet en
`http://localhost:3000/extranet/login.html`.

### Seguridad implementada

- JWT de acceso de corta vida + refresh token rotativo en cookie
  `HttpOnly; Secure; SameSite=Strict`.
- Protección CSRF (double-submit cookie) en todas las mutaciones.
- Rate limiting en el login: 5 intentos / 10 minutos por IP.
- Contraseñas con bcrypt (12 salt rounds); secretos solo en `.env` (fuera de git).
- Validación y sanitización de todos los inputs en el servidor.
- Headers: Content-Security-Policy, X-Frame-Options: DENY,
  X-Content-Type-Options: nosniff, Strict-Transport-Security.
- Log de auditoría de accesos en `server/logs/audit.log`.

En producción el servidor debe correr detrás de HTTPS (la cookie `Secure` y
HSTS lo exigen).
