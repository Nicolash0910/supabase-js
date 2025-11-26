import { supabase } from "./supabase.js";

/**
 * Panel administrativo: muestra usuarios y canciones.
 * - Muestra nombre del usuario y nombre de la playlist (joins).
 * - Permite editar duración de canciones.
 * - Permite eliminar usuarios y canciones.
 */
export async function mostrarAdmin() {
  const app = document.getElementById("app");
  app.innerHTML = `
  <section>
    <h2>Panel Administrativo</h2>
    <div id="panel">
      <div id="usuarios"></div>
      <div id="canciones"></div>
      <p id="mensaje"></p>
    </div>
  </section>
  `;

  const mensaje = document.getElementById("mensaje");
  const usuariosDiv = document.getElementById("usuarios");
  const cancionesDiv = document.getElementById("canciones");

  // ----- Verificar admin (simple, por correo) -----
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    app.innerHTML = "<p>⚠️ Debes iniciar sesión como administrador.</p>";
    return;
  }

  // ----- Cargar usuarios -----
  const { data: usuarios, error: errorUsers } = await supabase
    .from("usuarios")
    .select("id, nombre, correo, telefono")
    .order("nombre", { ascending: true });

  if (errorUsers) {
    usuariosDiv.innerHTML = `<p>Error cargando usuarios: ${errorUsers.message}</p>`;
    return;
  }
  if (user.email !== "nicolas.ramirezm@uniagustiniana.edu.co") {
app.innerHTML = "<p>⛔ No tienes permisos para acceder a este panel.</p>";
return;
}

  usuariosDiv.innerHTML = `
  <div id="users-cont">
    <h3>Lista de Usuarios</h3>
    ${
      usuarios.length === 0
        ? "<p>No hay usuarios registrados.</p>"
        : `<ul>
            ${usuarios.map(
              (usr) => `
              <li>
              <div class="user-info">
                <strong>${escapeHtml(usr.nombre)}</strong>
                (${escapeHtml(usr.correo)}) - ${escapeHtml(usr.telefono || "Sin teléfono")}
              </div>
                <button data-id="${usr.id}" class="borrar-usuario">Eliminar</button>
              </li>`
            ).join("")}
          </ul>`
    }
  </div>
  `;

  // ----- Cargar canciones con join para playlist -----
  const { data: canciones, error: errorSongs } = await supabase
    .from("canciones")
    .select(`
      id,
      titulo,
      descripcion,
      genero,
      duracion,
      portada,
      creado_en,
      usuarios(id,nombre,correo),
      playlists(id,nombre)
    `)
    .order("creado_en", { ascending: false });

  if (errorSongs) {
    cancionesDiv.innerHTML = `<p>Error cargando canciones: ${errorSongs.message}</p>`;
    return;
  }

  function getRelated(entity, possibleNames) {
    for (const name of possibleNames) {
      if (!entity[name]) continue;
      const val = entity[name];
      if (Array.isArray(val)) return val[0] || null;
      if (typeof val === "object") return val;
    }
    return null;
  }

  cancionesDiv.innerHTML = `
    <h3>🎵 Canciones Registradas</h3>
    ${
      !canciones || canciones.length === 0
        ? "<p>No hay canciones registradas.</p>"
        : `<ul>
            ${canciones.map((song) => {
              const usr = getRelated(song, ["usuario", "usuarios"]);
              const pl = getRelated(song, ["playlist", "playlists"]);
              const usrNombre = usr ? escapeHtml(usr.nombre) : "Usuario no encontrado";
              const plNombre = pl ? escapeHtml(pl.nombre) : "Playlist no encontrada";
              const descripcion = song.descripcion ? escapeHtml(song.descripcion) : "";
              const portadaHtml = song.portada
                ? `<div style="margin-top:6px;"><img src="${escapeAttr(song.portada)}" alt="${escapeAttr(song.titulo)}" style="max-width:160px;max-height:120px;object-fit:cover;"></div>`
                : "";

              return `
                <li>
                  <div><strong>${escapeHtml(song.titulo)}</strong> (${escapeHtml(song.genero)})</div>
                  <div>Usuario: ${usrNombre} — Playlist: ${plNombre}</div>
                  <div>${descripcion}</div>
                  ${portadaHtml}
                  <div>
                    Duración: <input type="number" min="0" step="0.1" value="${song.duracion ?? ""}" data-id="${song.id}" class="duracion-input" style="width:70px;">
                  </div>
                </li>
              `;
            }).join("")}
          </ul>
          <button id="guardar-duracion">💾 Guardar cambios</button>`
    }
  `;

  // ----- Event: borrar usuario -----
  document.querySelectorAll(".borrar-usuario").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.getAttribute("data-id");
      if (!id) return;
      if (!confirm("¿Eliminar este usuario? También se eliminarán sus canciones si hay FK con cascade.")) return;
      const { error: delError } = await supabase.from("usuarios").delete().eq("id", id);
      if (delError) {
        mensaje.textContent = "❌ Error eliminando usuario: " + delError.message;
        mensaje.style.color = "red";
      } else {
        mensaje.textContent = "✅ Usuario eliminado correctamente.";
        mensaje.style.color = "green";
        setTimeout(() => mostrarAdmin(), 700);
      }
    });
  });

  // ----- Event: guardar duración de canciones -----
  const guardarBtn = document.getElementById("guardar-duracion");
  if (guardarBtn) {
    guardarBtn.addEventListener("click", async () => {
      const inputs = document.querySelectorAll(".duracion-input");
      let errores = 0;
      for (const input of inputs) {
        const id = input.getAttribute("data-id");
        const raw = input.value;
        if (raw === "") continue;
        const duracion = parseFloat(raw);
        if (isNaN(duracion)) {
          errores++;
          continue;
        }
        const { error } = await supabase.from("canciones").update({ duracion }).eq("id", id);
        if (error) errores++;
      }
      if (errores > 0) {
        mensaje.textContent = "⚠️ Algunas duraciones no se actualizaron correctamente.";
        mensaje.style.color = "orange";
      } else {
        mensaje.textContent = "✅ Duraciones actualizadas correctamente.";
        mensaje.style.color = "green";
      }
      setTimeout(() => mostrarAdmin(), 800);
    });
  }
}

/** Helpers */
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function escapeAttr(str) {
  if (!str) return "";
  return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
