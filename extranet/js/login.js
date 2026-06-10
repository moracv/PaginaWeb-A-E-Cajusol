/* ═══ LOGIN — extranet ═══ */
(function () {
  'use strict';

  var form = document.getElementById('loginForm');
  var btn = document.getElementById('loginBtn');
  var errBox = document.getElementById('loginError');

  // Si ya hay sesión (cookie de refresh válida), entrar directo
  AEAuth.refresh().then(function (ok) {
    if (ok) window.location.href = 'admin.html';
  });

  function showError(msg) {
    errBox.textContent = msg;
    errBox.hidden = false;
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    errBox.hidden = true;

    var usuario = document.getElementById('usuario').value.trim();
    var clave = document.getElementById('clave').value;
    if (!usuario || !clave) {
      showError('Ingresa tu usuario y contraseña.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'VERIFICANDO…';

    AEAuth.login(usuario, clave)
      .then(function (result) {
        if (result.ok) {
          window.location.href = 'admin.html';
          return;
        }
        if (result.status === 429) {
          showError('Demasiados intentos. Espera 10 minutos e inténtalo de nuevo.');
        } else {
          showError('Usuario o contraseña incorrectos.');
        }
      })
      .catch(function () {
        showError('No se pudo conectar con el servidor. Verifica que el servidor esté activo.');
      })
      .then(function () {
        btn.disabled = false;
        btn.textContent = 'INGRESAR';
      });
  });
})();
