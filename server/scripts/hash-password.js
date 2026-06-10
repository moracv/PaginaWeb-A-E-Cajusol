/* Genera el hash bcrypt para ADMIN_PASSWORD_HASH.
   Uso: node scripts/hash-password.js
   Pide la contraseña sin mostrarla en pantalla. */
'use strict';

const readline = require('readline');
const bcrypt = require('bcryptjs');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Ocultar el eco de la contraseña
rl._writeToOutput = function (str) {
  if (this.stdoutMuted) this.output.write('*');
  else this.output.write(str);
};

rl.question('Nueva contraseña de administrador: ', (password) => {
  rl.close();
  console.log('');
  if (!password || password.length < 10) {
    console.error('La contraseña debe tener al menos 10 caracteres.');
    process.exit(1);
  }
  const hash = bcrypt.hashSync(password, 12);
  console.log('\nAgrega esta línea a server/.env:\n');
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
});
rl.stdoutMuted = true;
