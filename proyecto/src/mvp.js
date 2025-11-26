import { supabase } from './supabase.js';

export function mostrarMVP() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <section>
    <div id="song-upload">
    <div id="upload">
      <h2>Canción <span>(MVP Spotify)</span></h2>
      <form id="cancion-form">
        <input type="text" name="titulo" placeholder="Título" required />
        <textarea name="descripcion" placeholder="Descripción"></textarea>
        <select name="genero" required>
          <option value="">Selecciona un género</option>
          <option value="pop">Pop</option>
          <option value="rock">Rock</option>
          <option value="rap">Rap</option>
          <option value="electro">Electro</option>
          <option value="clasica">Clásica</option>
          <option value="otro">Otro</option>
        </select>
        <select name="playlist" required id="select-playlist">
          <option value="">Cargando playlists...</option>
        </select>
        <input type="number" name="duracion" placeholder="Duración (minutos)" min="0" step="0.01" required />
        <input type="text" name="portada" placeholder="URL de portada (opcional)" />
        <button type="submit">Subir Canción</button>
      </form>
    </div>
    <hr>
    <div id="song-list">
      <p id="mensaje" style="text-align:center;"></p>
      <h3>Mis Canciones</h3>
      <div id="lista-canciones"></div>
    </div>
    </div>
    </section>
  `;

  const form = document.getElementById('cancion-form');
  const mensaje = document.getElementById('mensaje');
  const lista = document.getElementById('lista-canciones');
  const selectPlaylist = document.getElementById('select-playlist');

  // 🔹 Cargar todas las playlists (sin filtrar por usuario para evitar error)
  async function cargarPlaylists() {
    const { data, error } = await supabase
      .from('playlists')
      .select('id, nombre')
      .order('nombre', { ascending: true });

    if (error) {
      selectPlaylist.innerHTML = `<option>Error al cargar playlists</option>`;
      return;
    }

    if (!data.length) {
      selectPlaylist.innerHTML = `<option>No hay playlists disponibles</option>`;
      return;
    }

    selectPlaylist.innerHTML = `<option value="">Selecciona una playlist</option>`;
    data.forEach(pl => {
      const opt = document.createElement('option');
      opt.value = pl.id;
      opt.textContent = pl.nombre;
      selectPlaylist.appendChild(opt);
    });
  }

  // 🔹 Cargar canciones del usuario
  async function cargarCanciones() {
    lista.innerHTML = 'Cargando canciones...';
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      mensaje.textContent = '⚠️ Debes iniciar sesión para ver tus canciones.';
      lista.innerHTML = '';
      return;
    }
    const { data, error } = await supabase
      .from('canciones')
      .select('id, titulo, descripcion, genero, duracion, portada')
      .eq('usuario_id', user.id)
      .order('id', { ascending: false });

    if (error) {
      lista.innerHTML = 'Error al cargar canciones.';
      return;
    }
    if (!data.length) {
      lista.innerHTML = '<p>No has subido canciones aún.</p>';
      return;
    }
    lista.innerHTML = '';
    data.forEach(cancion => {
      const div = document.createElement('div');
      div.innerHTML = `
      <div class="song-card">
        <h4>${cancion.titulo}</h4>
        <p>${cancion.descripcion || ''}</p>
        <p><b>Género:</b> ${cancion.genero.toUpperCase()}</p>
        <p><b>Duración:</b> ${cancion.duracion} minutos</p>
        ${cancion.portada ? `<img src="${cancion.portada}" alt="${cancion.titulo}" width="200">` : ''}
      </div>
      `;
      lista.appendChild(div);
    });
  }

  // 🔹 Subir nueva canción
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensaje.textContent = '';
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      mensaje.textContent = '⚠️ Debes iniciar sesión.';
      return;
    }
    const titulo = form.titulo.value.trim();
    const descripcion = form.descripcion.value.trim();
    const genero = form.genero.value;
    const playlist_id = form.playlist.value;
    const duracion = parseFloat(form.duracion.value);
    const portada = form.portada.value.trim();

    if (!titulo || !genero || !playlist_id || isNaN(duracion)) {
      mensaje.textContent = 'Por favor completa todos los campos obligatorios correctamente.';
      return;
    }

    const { error } = await supabase.from('canciones').insert([
      {
        titulo,
        descripcion,
        genero,
        duracion,
        portada,
        playlist_id,
        usuario_id: user.id,
      },
    ]);

    if (error) {
      mensaje.textContent = '❌ Error al subir canción: ' + error.message;
    } else {
      mensaje.textContent = '✅ Canción subida correctamente';
      form.reset();
      cargarCanciones();
    }
  });

  // Inicialización
  cargarPlaylists();
  cargarCanciones();
}
