document.addEventListener("DOMContentLoaded", () => {

  /* =====================
      API HELPERS
  ===================== */

  const API_URL = "http://localhost:3000/tareas";

  async function apiGetTareas() {
    const res = await fetch(API_URL, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    });
    return await res.json();
  }

  async function apiAddTarea(tarea) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify(tarea)
    });
    return await res.json();
  }

  async function apiDeleteTarea(id) {
    await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    });
  }

  async function apiUpdateTarea(id, data) {
    await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify(data)
    });
  }

  // --- NUEVA FUNCIÓN DE SINCRONIZACIÓN ---
  async function sincronizarDesdeBackend() {
    try {
      const tareasServidor = await apiGetTareas();
      guardarTareas(tareasServidor);
    } catch (e) {
      console.warn("No se pudo sincronizar con el backend");
    }
  }


  /* =====================
      USUARIOS BASE HALO
  ===================== */

  const usuariosHalo = [
    { username: "Chief", password: "117", role: "user" },
    { username: "Cortana", password: "AI", role: "user" },
    { username: "Atriox", password: "Banished", role: "user" }
  ];

  /* =====================
      LOGIN (API) - FIX FINAL
  ===================== */

  const btnLogin = document.getElementById("btnLogin");

  if (btnLogin) {
    btnLogin.onclick = async () => {

      const userInput = document.getElementById("user");
      const passInput = document.getElementById("pass");
      const errorBox = document.getElementById("error");

      const user = userInput.value.trim();
      const pass = passInput.value.trim();

      errorBox.textContent = "";

      if (!user || !pass) {
        errorBox.textContent = "Campos incompletos";
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username: user,
            password: pass
          })
        });

        const data = await res.json();

        if (!res.ok) {
          errorBox.textContent = data.error || "Login inválido";
          return;
        }

        // GUARDAMOS TOKEN
        localStorage.setItem("token", data.token);
        localStorage.setItem("usuarioActivo", user);

        // ROL (simple para la tarea)
        localStorage.setItem(
          "rol",
          user.toLowerCase() === "gael" ? "admin" : "user"
        );

        alert(`¡Bienvenido ${user}!`);
        window.location.href = "tasks.html";

      } catch (err) {
        console.error(err);
        errorBox.textContent = "Servidor no disponible";
      }
    };

    // ENTER PARA LOGIN
    document.getElementById("pass").addEventListener("keypress", e => {
      if (e.key === "Enter") btnLogin.click();
    });
  }

  /* =====================
      PERMISOS ADMIN MENU
  ===================== */

  const linkUsuarios = document.getElementById("linkUsuarios");
  if (linkUsuarios) {
    linkUsuarios.style.display =
      localStorage.getItem("rol") === "admin" ? "inline-block" : "none";
  }

  /* =====================
      SELECT USUARIOS
  ===================== */

  const select = document.getElementById("usuarioAsignado");

  if (select) {

    select.innerHTML = '<option value="">Asignar Usuario</option>';

    usuariosHalo.forEach(u => {
      const o = document.createElement("option");
      o.value = u.username;
      o.textContent = u.username;
      select.appendChild(o);
    });

    const extra = JSON.parse(localStorage.getItem("usuariosExtra") || "{}");

    Object.keys(extra).forEach(u => {
      const o = document.createElement("option");
      o.value = u;
      o.textContent = u;
      select.appendChild(o);
    });
  }

  /* =====================
      TAREAS GLOBALES
  ===================== */

  const grid = document.getElementById("taskGrid");
  const btnAgregar = document.getElementById("btnAgregar");

  function obtenerTareas() {
    return JSON.parse(localStorage.getItem("tareasGlobales") || "[]");
  }

  function guardarTareas(t) {
    localStorage.setItem("tareasGlobales", JSON.stringify(t));
  }

  function puedeEditar(t) {
    const user = localStorage.getItem("usuarioActivo");
    const rol = localStorage.getItem("rol");
    return rol === "admin" || t.creador === user;
  }

  /* =====================
      PINTAR TAREAS
  ===================== */

  function pintarTareas() {

    if (!grid) return;

    grid.innerHTML = "";
    const tareas = obtenerTareas();

    tareas.forEach((t, i) => {

      const card = document.createElement("div");
      card.className = "task-card";
      if (t.done) card.classList.add("done");

      const editable = puedeEditar(t);

      card.innerHTML = `
   <h3>${t.texto}</h3>
   <span class="badge ${t.prioridad}">${t.prioridad}</span>

   <div class="task-meta">
    <p><b>Creada:</b> ${t.fechaCreacion}</p>
    <p><b>Entrega:</b> ${t.fechaEntrega}</p>
    <p><b>De:</b> ${t.creador}</p>
    <p><b>Para:</b> ${t.asignado}</p>
   </div>

   <div class="task-actions">
    <button class="ok">✔</button>
    ${editable ? '<button class="edit">✏</button>' : ''}
    ${editable ? '<button class="del">🗑</button>' : ''}
   </div>
  `;

      card.querySelector(".ok").onclick = () => {
        tareas[i].done = !tareas[i].done;
        
        // Sincronizar actualización con backend si existe ID
        if(tareas[i].id) apiUpdateTarea(tareas[i].id, tareas[i]);
        
        guardarTareas(tareas);
        pintarTareas();
      };

      if (editable) {
        // --- CAMBIO SOLICITADO: ELIMINAR DEL BACKEND ---
        card.querySelector(".del").onclick = () => {
          if (t.id) {
            apiDeleteTarea(t.id);
          }
          tareas.splice(i, 1);
          guardarTareas(tareas);
          pintarTareas();
        };

        card.querySelector(".edit").onclick = () => {

          const modal = document.getElementById("editModal");
          const editTexto = document.getElementById("editTexto");
          const editFecha = document.getElementById("editFecha");

          modal.classList.remove("hidden");

          editTexto.value = t.texto;
          editFecha.value = t.fechaEntrega;

          document.getElementById("saveEdit").onclick = () => {
            t.texto = editTexto.value;
            t.fechaEntrega = editFecha.value;

            // Sincronizar edición con backend
            if(t.id) apiUpdateTarea(t.id, t);

            guardarTareas(tareas);
            pintarTareas();
            modal.classList.add("hidden");
          };

          document.getElementById("cancelEdit").onclick = () => {
            modal.classList.add("hidden");
          };
        };

      }

      grid.appendChild(card);
    });
  }

  /* =====================
      AGREGAR TAREA
  ===================== */

  if (btnAgregar && grid) {

    btnAgregar.onclick = async () => {

      const texto = document.getElementById("taskInput").value.trim();
      const asignado = document.getElementById("usuarioAsignado").value;
      const prioridad = document.getElementById("prioridad").value;
      const fecha = document.getElementById("fechaEntrega").value;

      if (!texto) return alert("Escribe tarea");
      if (!fecha) return alert("Selecciona fecha");

      const nuevaTarea = {
        texto,
        asignado,
        prioridad,
        fechaEntrega: fecha,
        // ESTANDARIZACIÓN AQUÍ: AAAA-MM-DD
        fechaCreacion: new Date().toISOString().split('T')[0],
        creador: localStorage.getItem("usuarioActivo"),
        done: false
      };

      // --- CAMBIO SOLICITADO: ENVIAR AL BACKEND ---
      try {
        await apiAddTarea(nuevaTarea);
      } catch (err) {
        console.error("Error al guardar en backend", err);
      }

      const tareas = obtenerTareas();
      tareas.push(nuevaTarea);
      guardarTareas(tareas);
      
      // Sincronizamos para obtener el ID real generado por el servidor
      await sincronizarDesdeBackend();
      pintarTareas();

      document.getElementById("taskInput").value = "";
      document.getElementById("fechaEntrega").value = "";
    };
  }

  // --- CAMBIO SOLICITADO: CARGA INICIAL CON BACKEND ---
  sincronizarDesdeBackend().then(pintarTareas);

  /* =====================
      CREAR USUARIOS ADMIN
  ===================== */

  const btnCrearUsuario = document.getElementById("btnCrearUsuario");

  if (btnCrearUsuario && localStorage.getItem("rol") === "admin") {

    btnCrearUsuario.style.display = "inline-block";

    btnCrearUsuario.onclick = () => {

      const u = prompt("Nuevo usuario:");
      if (!u) return;

      const p = prompt("Contraseña:");
      if (!p) return;

      const extra = JSON.parse(localStorage.getItem("usuariosExtra") || "{}");
      extra[u.toLowerCase()] = p;

      localStorage.setItem("usuariosExtra", JSON.stringify(extra));
      alert("Usuario creado");
    };
  }

  /* ===== FECHA — abrir calendario al hacer click ===== */

  const fechaInput = document.getElementById("fechaEntrega");

  if (fechaInput) {
    fechaInput.addEventListener("click", () => {
      if (fechaInput.showPicker) {
        fechaInput.showPicker();
      }
    });
    fechaInput.addEventListener("keydown", e => {
      e.preventDefault();
    });
  }

  const editFechaInput = document.getElementById("editFecha");

  if (editFechaInput) {
    editFechaInput.addEventListener("click", () => {
      if (editFechaInput.showPicker) {
        editFechaInput.showPicker();
      }
    });
    editFechaInput.addEventListener("keydown", e => e.preventDefault());
  }

  /* ===== MENU HAMBURGUESA UNIVERSAL ===== */
  const btnMenu = document.getElementById("menuToggle");

  if (btnMenu) {
    btnMenu.onclick = function () {
      const navPrincipal = document.querySelector(".navbar");
      const navGestor = document.querySelector(".topnav");

      if (navPrincipal) {
        navPrincipal.classList.toggle("active");
      }
      if (navGestor) {
        navGestor.classList.toggle("show");
      }
    };
  }

  /* =====================
      PANEL USUARIOS
  ===================== */

  const panelUsuarios = document.getElementById("panelUsuarios");
  const listaUsuarios = document.getElementById("listaUsuarios");
  const cerrarPanel = document.getElementById("cerrarPanel");

  function obtenerUsuariosTodos() {
    const base = ["gael", "chief", "cortana", "atriox"];
    const extra = JSON.parse(localStorage.getItem("usuariosExtra") || "{}");
    return [...base, ...Object.keys(extra)];
  }

  function pintarUsuariosPanel() {
    if (!listaUsuarios) return;
    listaUsuarios.innerHTML = "";
    const usuarios = obtenerUsuariosTodos();

    usuarios.forEach(user => {
      const div = document.createElement("div");
      div.className = "usuario-item";
      const esAdmin = localStorage.getItem("rol") === "admin";
      div.innerHTML = `
   <span>${user}</span>
   ${esAdmin ? `<button data-user="${user}">Eliminar</button>` : ""}
  `;
      listaUsuarios.appendChild(div);
    });
  }

  linkUsuarios?.addEventListener("click", e => {
    e.preventDefault();
    panelUsuarios.classList.add("show");
    pintarUsuariosPanel();
  });

  cerrarPanel?.addEventListener("click", () => {
    panelUsuarios.classList.remove("show");
  });

  listaUsuarios?.addEventListener("click", e => {
    if (e.target.tagName !== "BUTTON") return;
    const user = e.target.dataset.user;
    if (!confirm(`¿Eliminar usuario ${user}?`)) return;
    const extra = JSON.parse(localStorage.getItem("usuariosExtra") || "{}");
    delete extra[user];
    localStorage.setItem("usuariosExtra", JSON.stringify(extra));
    pintarUsuariosPanel();
    alert("Usuario eliminado");
  });

});