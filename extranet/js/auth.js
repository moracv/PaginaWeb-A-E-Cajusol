/* ═══ AUTH — cliente de autenticación de la extranet ═══
   El access token (JWT, corta vida) se guarda SOLO en memoria.
   El refresh token viaja en cookie HttpOnly/Secure/SameSite=Strict
   gestionada por el servidor; el JS nunca puede leerlo.
   El token CSRF (double-submit) se lee de la cookie legible "ae_csrf"
   y se reenvía en el header X-CSRF-Token en cada mutación. */
var AEAuth = (function () {
  'use strict';

  var API = '/api';
  var accessToken = null;

  function getCsrfToken() {
    var match = document.cookie.match(/(?:^|;\s*)ae_csrf=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function request(path, options) {
    options = options || {};
    var headers = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = 'Bearer ' + accessToken;
    var method = (options.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      headers['X-CSRF-Token'] = getCsrfToken();
    }
    return fetch(API + path, {
      method: method,
      headers: headers,
      credentials: 'same-origin',
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  }

  /* Pide un access token nuevo usando la cookie de refresh.
     Devuelve true si hay sesión válida. */
  function refresh() {
    return request('/auth/refresh', { method: 'POST' })
      .then(function (res) {
        if (!res.ok) return false;
        return res.json().then(function (data) {
          accessToken = data.accessToken || null;
          return !!accessToken;
        });
      })
      .catch(function () { return false; });
  }

  /* Reintenta una vez con refresh si el access token expiró (401). */
  function authedRequest(path, options) {
    return request(path, options).then(function (res) {
      if (res.status !== 401) return res;
      return refresh().then(function (ok) {
        if (!ok) {
          window.location.href = 'login.html';
          return res;
        }
        return request(path, options);
      });
    });
  }

  function login(usuario, clave) {
    return request('/auth/login', { method: 'POST', body: { usuario: usuario, clave: clave } })
      .then(function (res) {
        return res.json().then(function (data) {
          if (res.ok && data.accessToken) {
            accessToken = data.accessToken;
            return { ok: true };
          }
          return { ok: false, status: res.status, error: data.error || 'Error de autenticación' };
        });
      });
  }

  function logout() {
    return request('/auth/logout', { method: 'POST' })
      .catch(function () {})
      .then(function () {
        accessToken = null;
        window.location.href = 'login.html';
      });
  }

  return {
    login: login,
    logout: logout,
    refresh: refresh,
    request: authedRequest
  };
})();
