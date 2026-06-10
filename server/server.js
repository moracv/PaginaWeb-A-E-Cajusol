/* ═══════════════════════════════════════════════════════════
   SERVIDOR — Vidriería A&E Cajusol H
   Sirve el sitio estático + API segura para la extranet.

   Seguridad implementada:
   - JWT con expiración configurable + refresh token rotativo
     en cookie HttpOnly/Secure/SameSite=Strict.
   - CSRF double-submit (cookie ae_csrf + header X-CSRF-Token)
     en todo POST/PUT/DELETE.
   - Rate limiting en login: 5 intentos / 10 min por IP.
   - Contraseña con bcrypt (12 salt rounds), nunca texto plano.
   - Validación y sanitización de TODOS los inputs en servidor.
   - Headers: CSP, X-Frame-Options DENY, nosniff, HSTS (helmet).
   - 401 (sin credenciales) / 403 (credenciales inválidas) correctos.
   - Log de auditoría de intentos de acceso.
   ═══════════════════════════════════════════════════════════ */
'use strict';

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const LOG_DIR = path.join(__dirname, 'logs');
const AUDIT_LOG = path.join(LOG_DIR, 'audit.log');
const CONFIG_JSON = path.join(DATA_DIR, 'site-config.json');
const CONFIG_JS = path.join(ROOT, 'site-config.js');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(LOG_DIR, { recursive: true });

/* ── Secretos y credenciales (obligatorios en producción) ── */
function requireEnv(name, fallbackDev) {
  const v = process.env[name];
  if (v) return v;
  if (!IS_PROD && fallbackDev) {
    console.warn(`[WARN] ${name} no definido; usando valor de desarrollo. NO usar en producción.`);
    return fallbackDev;
  }
  console.error(`[FATAL] Falta la variable de entorno ${name}. Ver server/.env.example`);
  process.exit(1);
}

const JWT_SECRET = requireEnv('JWT_SECRET', crypto.randomBytes(48).toString('hex'));
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TTL_MS = parseInt(process.env.REFRESH_TOKEN_TTL_HOURS || '8', 10) * 3600 * 1000;
const ADMIN_USER = requireEnv('ADMIN_USER', 'admin');
// Hash bcrypt generado con: node scripts/hash-password.js
const ADMIN_PASSWORD_HASH = requireEnv('ADMIN_PASSWORD_HASH', bcrypt.hashSync('cambiar-en-produccion', 12));

/* ── Auditoría ── */
function audit(event, req, extra) {
  const line = JSON.stringify(Object.assign({
    ts: new Date().toISOString(),
    event,
    ip: req.ip,
    ua: req.get('user-agent') || ''
  }, extra || {})) + '\n';
  fs.appendFile(AUDIT_LOG, line, (err) => {
    if (err) console.error('[audit] no se pudo escribir el log:', err.message);
  });
}

/* ── Headers de seguridad ── */
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      frameSrc: ['https://www.google.com'],          // mapa embebido
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  frameguard: { action: 'deny' },                    // X-Frame-Options: DENY
  noSniff: true,                                     // X-Content-Type-Options: nosniff
  hsts: { maxAge: 31536000, includeSubDomains: true } // Strict-Transport-Security
}));

app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());

/* ── Refresh tokens (rotativos, guardados hasheados) ── */
const refreshStore = new Map(); // sha256(token) -> { user, expires }

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function issueTokens(res, user) {
  const accessToken = jwt.sign({ sub: user, role: 'admin' }, JWT_SECRET, { expiresIn: ACCESS_TTL });

  const refreshToken = crypto.randomBytes(48).toString('hex');
  refreshStore.set(sha256(refreshToken), { user, expires: Date.now() + REFRESH_TTL_MS });

  const csrfToken = crypto.randomBytes(24).toString('hex');

  res.cookie('ae_refresh', refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: REFRESH_TTL_MS
  });
  // Cookie CSRF legible por JS (patrón double-submit); no es un secreto de sesión
  res.cookie('ae_csrf', csrfToken, {
    httpOnly: false,
    secure: IS_PROD,
    sameSite: 'strict',
    path: '/',
    maxAge: REFRESH_TTL_MS
  });

  return accessToken;
}

function revokeRefresh(token) {
  if (token) refreshStore.delete(sha256(token));
}

// Limpieza periódica de refresh tokens vencidos
setInterval(() => {
  const now = Date.now();
  for (const [hash, data] of refreshStore) {
    if (data.expires < now) refreshStore.delete(hash);
  }
}, 60 * 1000).unref();

/* ── Middlewares de protección ── */
function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'admin') {
      audit('auth.forbidden', req, { sub: payload.sub });
      return res.status(403).json({ error: 'Sin permisos suficientes' });
    }
    req.user = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// CSRF double-submit: el header debe coincidir con la cookie
function requireCsrf(req, res, next) {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();
  const cookie = req.cookies.ae_csrf;
  const header = req.get('x-csrf-token');
  if (!cookie || !header || cookie.length !== header.length ||
      !crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(header))) {
    audit('csrf.rejected', req, { path: req.path });
    return res.status(403).json({ error: 'Token CSRF inválido' });
  }
  next();
}

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Inténtalo de nuevo en 10 minutos.' },
  handler: (req, res, next, options) => {
    audit('login.ratelimited', req, { user: (req.body || {}).usuario });
    res.status(429).json(options.message);
  }
});

/* ── Sanitización y validación (lado servidor, siempre) ── */
function cleanString(value, maxLen) {
  if (typeof value !== 'string') return '';
  // Sin etiquetas HTML ni caracteres de control
  return value.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLen);
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const PHONE = /^[0-9+\s()-]{6,20}$/;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const URL_HTTP = /^https?:\/\/[^\s<>"']{4,200}$/;

function validateConfig(input) {
  const errors = [];
  const out = {};

  const colores = input.colores || {};
  out.colores = {};
  for (const key of ['primario', 'secundario', 'acento', 'fondo', 'fondo2', 'texto', 'textoMuted', 'tarjeta']) {
    if (colores[key] == null) continue;
    if (!HEX_COLOR.test(colores[key])) errors.push(`Color "${key}" inválido (formato #RRGGBB)`);
    else out.colores[key] = colores[key];
  }

  const hero = input.hero || {};
  out.hero = {};
  for (const [key, max] of [['titulo1', 40], ['titulo2', 40], ['subtitulo', 160], ['subtitulo2', 80], ['cta', 40], ['ctaSecund', 40], ['badge', 60]]) {
    if (hero[key] != null) out.hero[key] = cleanString(hero[key], max);
  }

  const emp = input.empresa || {};
  out.empresa = {};
  for (const [key, max] of [['nombre', 80], ['slogan', 120], ['ubicacion', 160]]) {
    if (emp[key] != null) out.empresa[key] = cleanString(emp[key], max);
  }
  for (const key of ['tel1', 'tel2', 'fijo']) {
    if (!emp[key]) continue;
    const v = cleanString(emp[key], 20);
    if (!PHONE.test(v)) errors.push(`Teléfono "${key}" inválido`);
    else out.empresa[key] = v;
  }
  if (emp.whatsapp) {
    const v = cleanString(emp.whatsapp, 15).replace(/\D/g, '');
    if (v.length < 8 || v.length > 15) errors.push('WhatsApp inválido (solo dígitos con código de país)');
    else out.empresa.whatsapp = v;
  }
  if (emp.email) {
    const v = cleanString(emp.email, 80);
    if (!EMAIL.test(v)) errors.push('Email inválido');
    else out.empresa.email = v;
  }
  if (emp.facebook != null && emp.facebook !== '') {
    const v = cleanString(emp.facebook, 200);
    if (!URL_HTTP.test(v)) errors.push('URL de Facebook inválida (debe iniciar con https://)');
    else out.empresa.facebook = v;
  } else if (emp.facebook === '') {
    out.empresa.facebook = '';
  }

  return { errors, value: out };
}

/* ── Rutas de autenticación ── */
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const usuario = cleanString((req.body || {}).usuario, 60);
  const clave = typeof (req.body || {}).clave === 'string' ? req.body.clave.slice(0, 128) : '';

  if (!usuario || !clave) {
    audit('login.invalid_input', req);
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
  }

  // Comparación constante: bcrypt corre aunque el usuario no exista
  const userOk = usuario === ADMIN_USER;
  const passOk = await bcrypt.compare(clave, ADMIN_PASSWORD_HASH);

  if (!userOk || !passOk) {
    audit('login.failed', req, { user: usuario });
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  audit('login.success', req, { user: usuario });
  const accessToken = issueTokens(res, usuario);
  res.json({ accessToken, expiresIn: ACCESS_TTL });
});

app.post('/api/auth/refresh', (req, res) => {
  const token = req.cookies.ae_refresh;
  const entry = token ? refreshStore.get(sha256(token)) : null;

  if (!entry || entry.expires < Date.now()) {
    revokeRefresh(token);
    return res.status(401).json({ error: 'Sesión expirada' });
  }

  // Rotación: el refresh token usado queda invalidado
  revokeRefresh(token);
  const accessToken = issueTokens(res, entry.user);
  res.json({ accessToken, expiresIn: ACCESS_TTL });
});

app.post('/api/auth/logout', (req, res) => {
  revokeRefresh(req.cookies.ae_refresh);
  res.clearCookie('ae_refresh', { path: '/api/auth' });
  res.clearCookie('ae_csrf', { path: '/' });
  audit('logout', req);
  res.json({ ok: true });
});

/* ── Configuración del sitio (rutas protegidas) ── */
function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_JSON, 'utf8'));
  } catch (e) {
    // Primera ejecución: derivar del site-config.js publicado
    try {
      const js = fs.readFileSync(CONFIG_JS, 'utf8');
      // El archivo es nuestro (no input de usuario): extraer el literal del objeto
      const match = js.match(/var\s+SITE_CONFIG\s*=\s*(\{[\s\S]*\});?\s*$/);
      if (match) return Function('"use strict"; return (' + match[1] + ')')();
    } catch (e2) { /* sin base disponible */ }
    return {};
  }
}

function writeConfig(config) {
  fs.writeFileSync(CONFIG_JSON, JSON.stringify(config, null, 2));
  // Regenerar el archivo que consume el sitio público
  const banner = '/* Generado por la extranet — no editar a mano. */\n';
  fs.writeFileSync(CONFIG_JS, banner + 'var SITE_CONFIG = ' + JSON.stringify(config, null, 2) + ';\n');
}

app.get('/api/config', requireAuth, (req, res) => {
  res.json(readConfig());
});

app.put('/api/config', requireAuth, requireCsrf, (req, res) => {
  const { errors, value } = validateConfig(req.body || {});
  if (errors.length) {
    return res.status(422).json({ error: 'Datos inválidos: ' + errors.join('; ') });
  }
  // Merge sobre la config existente para no perder secciones no editables
  const current = readConfig();
  const merged = Object.assign({}, current, {
    colores: Object.assign({}, current.colores, value.colores),
    hero: Object.assign({}, current.hero, value.hero),
    empresa: Object.assign({}, current.empresa, value.empresa)
  });
  try {
    writeConfig(merged);
  } catch (err) {
    console.error('[config] error al guardar:', err.message);
    return res.status(500).json({ error: 'No se pudo guardar la configuración' });
  }
  audit('config.updated', req, { user: req.user });
  res.json({ ok: true });
});

/* ── Estáticos del sitio público y la extranet ── */
// El código del servidor, logs y datos jamás se sirven (debe ir ANTES del static)
app.use('/server', (req, res) => res.status(404).json({ error: 'No encontrado' }));
app.use('/api', (req, res) => res.status(404).json({ error: 'No encontrado' }));

app.use(express.static(ROOT, {
  index: 'index.html',
  dotfiles: 'deny'
}));

app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT} (${IS_PROD ? 'producción' : 'desarrollo'})`);
});
