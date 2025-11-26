// src/registro.js
import { supabase } from './supabase.js';

export function mostrarRegistro() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <section>
    <div id="registration-page">
      <h2>Crear cuenta  De Spotife </h2>
      <form id="registro-form">
        <input type="text" name="nombre" placeholder="Nombre de usuario" required />
        <input type="email" name="correo" placeholder="Correo electrónico" required />
        <input type="password" name="password" placeholder="Contraseña" required />
        <input type="text" name="telefono" placeholder="Número de teléfono" required />
        <button type="submit">Registrarse</button>
      </form>
      <p id="error" style="color:red;"></p>
      <p id="register-now">¿Ya tienes cuenta? <a id="ir-login" href="#">Inicia sesión</a></p>
    </div>
    </section>
  `;

  const form = document.getElementById('registro-form');
  const errorMsg = document.getElementById('error');
  const irLogin = document.getElementById('ir-login');

  irLogin.addEventListener('click', () => {
    mostrarLogin();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';

    const nombre = form.nombre.value.trim();
    const correo = form.correo.value.trim();
    const password = form.password.value.trim();
    const telefono = form.telefono.value.trim();

    if (!nombre || !correo || !password || !telefono) {
      errorMsg.textContent = '⚠️ Completa todos los campos.';
      return;
    }

    // 1️⃣ Crear usuario en Supabase Auth
    const { data: dataAuth, error: errorAuth } = await supabase.auth.signUp({
      email: correo,
      password: password,
    });

    if (errorAuth) {
      errorMsg.textContent = `Error creando cuenta: ${errorAuth.message}`;
      return;
    }

    const uid = dataAuth.user?.id;
    if (!uid) {
      errorMsg.textContent = 'No se pudo obtener el ID del usuario.';
      return;
    }

    // 2️⃣ Guardar información en tabla "usuarios"
    const { error: errorInsert } = await supabase.from('usuarios').insert([
      { id: uid, nombre, correo, telefono },
    ]);

    if (errorInsert) {
      errorMsg.textContent = 'Error guardando datos: ' + errorInsert.message;
      return;
    }

    alert('🎉 ¡Cuenta creada con éxito! Ahora puedes iniciar sesión.');
    mostrarLogin();
  });
}
