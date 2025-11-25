// src/menu.js
import { supabase } from "./supabase.js";
import { mostrarRegistro } from "./register.js";
import { mostrarLogin } from "./login.js";
import { mostrarMVP } from "./mvp.js";
import { mostrarUser } from "./user.js";
import { mostrarAdmin } from "./admin.js";

const routes = {
  'registro': mostrarRegistro,
  'login': mostrarLogin,
  'canciones': mostrarMVP,
  'usuarios': mostrarUser,
  'admin': mostrarAdmin
};

export async function CerrarSesion() {
  await supabase.auth.signOut();
  location.reload();
}

export async function cargarMenu() {
  const menu = document.getElementById("menu");
  if (!menu) return;

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    user = data?.user ?? null;
  } catch (err) {
    user = null;
  }

  console.log("Usuario actual:", user); // 🧪 Ver qué hay en user

  if (!user) {
    menu.innerHTML = `
      <div>
        <button data-action="registro">Registrarse</button>
        <button data-action="login">Iniciar sesión</button>
      </div>
    `;
  } else {
    const email = user.email?.toLowerCase() || "";
    const esAdmin = (email === 'nicolas.ramirezm@uniagustiniana.edu.co');  
    console.log("esAdmin:", esAdmin); // 🧪 Ver si la condición de admin pasa

    menu.innerHTML = `
      <div>
        <button data-action="canciones">Subir Canciones</button>
        <button data-action="usuarios">Mi Perfil</button>
        ${esAdmin ? '<button data-action="admin">Admin</button>' : ''}
        <button data-action="logout">Cerrar sesión</button>
      </div>
    `;
  }

  menu.querySelectorAll('button').forEach(button => {
    const action = button.getAttribute('data-action');
    if (action === 'logout') {
      button.addEventListener('click', CerrarSesion);
    } else if (routes[action]) {
      button.addEventListener('click', routes[action]);
    }
  });
}

document.addEventListener("DOMContentLoaded", cargarMenu);
