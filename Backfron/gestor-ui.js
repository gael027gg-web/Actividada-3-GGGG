document.addEventListener("DOMContentLoaded", () => {

    verificarPermisos();

    const grid = document.getElementById("taskGrid");
    const btn = document.getElementById("agregarTarea");

    btn?.addEventListener("click", crearTarea);

    function crearTarea() {

        const texto = inputTarea.value.trim();
        if (!texto) return;

        const fecha = fechaEntrega.value || "Sin fecha";
        const user = asignado.value || "Sin asignar";
        const prio = prioridad.value;

        const card = document.createElement("div");
        card.className = "task-card";

        card.innerHTML = `
            <div>
                <h3>${texto}</h3>
                <p>Asignado: ${user}</p>
                <p>Entrega: ${fecha}</p>
                <span class="badge ${prio}">${prio}</span>
            </div>

            <div class="card-footer">
                <span class="icon-btn" onclick="marcarDone(this)">✅</span>
                <span class="icon-btn" onclick="editarCard(this)">✏️</span>
                <span class="icon-btn" onclick="alert('Detalles')">📎</span>
                <span class="icon-btn" onclick="this.closest('.task-card').remove()">🗑️</span>
            </div>
        `;

        grid.appendChild(card);
        inputTarea.value = "";
    }

});

/* ===== ACCIONES ===== */

function marcarDone(btn) {
    const card = btn.closest(".task-card");
    card.style.opacity = "0.6";
    card.style.textDecoration = "line-through";
}

function editarCard(btn) {
    const card = btn.closest(".task-card");
    const h3 = card.querySelector("h3");
    const nuevo = prompt("Editar tarea:", h3.textContent);
    if (nuevo) h3.textContent = nuevo;
}

/* ===== PERMISOS ADMIN ===== */

function verificarPermisos() {
    const role = localStorage.getItem("role");
    const link = document.getElementById("linkUsuarios");
    if (!link) return;

    link.style.display = role === "admin" ? "inline-block" : "none";
}
