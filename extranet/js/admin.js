/* ═══ ADMIN — panel de edición del sitio ═══
   Lee la config del servidor (GET /api/config) y guarda
   cambios validados en el servidor (PUT /api/config). */
(function () {
  'use strict';

  var main = document.getElementById('adminMain');
  var loading = document.getElementById('adminLoading');
  var statusBox = document.getElementById('adminStatus');
  var form = document.getElementById('configForm');
  var saveBtn = document.getElementById('saveBtn');
  var config = {};

  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return (o || {})[k]; }, obj);
  }
  function setPath(obj, path, value) {
    var keys = path.split('.');
    var last = keys.pop();
    var target = keys.reduce(function (o, k) {
      if (!o[k] || typeof o[k] !== 'object') o[k] = {};
      return o[k];
    }, obj);
    target[last] = value;
  }

  function showStatus(msg, ok) {
    statusBox.textContent = msg;
    statusBox.className = 'admin-status ' + (ok ? 'ok' : 'err');
    statusBox.hidden = false;
  }

  function fillForm() {
    form.querySelectorAll('[data-path]').forEach(function (input) {
      var v = getPath(config, input.getAttribute('data-path'));
      if (v != null) input.value = v;
    });
  }

  function collectForm() {
    form.querySelectorAll('[data-path]').forEach(function (input) {
      setPath(config, input.getAttribute('data-path'), input.value.trim());
    });
  }

  // Verificar sesión y cargar config
  AEAuth.refresh().then(function (ok) {
    if (!ok) { window.location.href = 'login.html'; return; }
    return AEAuth.request('/config').then(function (res) {
      if (res && res.ok) return res.json();
      // Sin backend de config: usar la base local como punto de partida
      return (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG : {};
    }).then(function (data) {
      config = data || {};
      fillForm();
      loading.hidden = true;
      main.hidden = false;
    });
  });

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    collectForm();
    saveBtn.disabled = true;
    saveBtn.textContent = 'GUARDANDO…';

    AEAuth.request('/config', { method: 'PUT', body: config })
      .then(function (res) {
        if (res && res.ok) {
          showStatus('Cambios guardados correctamente. El sitio ya muestra la nueva configuración.', true);
        } else if (res && res.status === 403) {
          showStatus('Sesión o token CSRF inválido. Recarga la página e inténtalo de nuevo.', false);
        } else {
          return res.json().then(function (data) {
            showStatus(data.error || 'No se pudieron guardar los cambios.', false);
          });
        }
      })
      .catch(function () {
        showStatus('Error de conexión con el servidor.', false);
      })
      .then(function () {
        saveBtn.disabled = false;
        saveBtn.textContent = 'GUARDAR CAMBIOS';
        statusBox.focus && statusBox.focus();
      });
  });

  document.getElementById('logoutBtn').addEventListener('click', function () {
    AEAuth.logout();
  });
})();
