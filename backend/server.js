const express = require("express");
const fs = require("fs").promises;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const cors = require("cors"); // Agregado por seguridad para conectar con el frontend

const app = express();
const PORT = 3000;
const SECRET = "clave_secreta_profe";

// Middlewares
app.use(cors());
app.use(express.json());

// --------------------
// UTILIDADES FS
// --------------------
async function leerJSON(ruta) {
  try {
    const data = await fs.readFile(ruta, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    // Si el archivo no existe, retornamos un array vacío
    return [];
  }
}

async function escribirJSON(ruta, data) {
  await fs.writeFile(ruta, JSON.stringify(data, null, 2));
}

// --------------------
// RUTA DE PRUEBA (Para que no salga "Cannot GET /")
// --------------------
app.get("/", (req, res) => {
  res.send("🚀 Servidor de la Actividad 3 funcionando correctamente en el puerto " + PORT);
});

// --------------------
// AUTH MIDDLEWARE
// --------------------
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Token requerido" });

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
}

// --------------------
// REGISTER
// --------------------
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Datos incompletos" });

  const users = await leerJSON("usuarios.json");
  if (users.find(u => u.username === username))
    return res.status(400).json({ error: "Usuario existente" });

  const hash = await bcrypt.hash(password, 10);
  users.push({ username, password: hash });

  await escribirJSON("usuarios.json", users);
  res.json({ message: "Usuario creado con éxito" });
});

// --------------------
// LOGIN
// --------------------
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const users = await leerJSON("usuarios.json");

  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

  const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });
  res.json({ token });
});

// --------------------
// TAREAS (CRUD)
// --------------------
app.get("/tareas", auth, async (req, res) => {
  const tareas = await leerJSON("tareas.json");
  res.json(tareas);
});

app.post("/tareas", auth, async (req, res) => {
  const tareas = await leerJSON("tareas.json");

  const nueva = {
    id: Date.now(),
    ...req.body,
    creador: req.user.username
  };

  tareas.push(nueva);
  await escribirJSON("tareas.json", tareas);
  res.json(nueva);
});

app.put("/tareas/:id", auth, async (req, res) => {
  const tareas = await leerJSON("tareas.json");
  const id = Number(req.params.id);

  const index = tareas.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: "No existe la tarea" });

  tareas[index] = { ...tareas[index], ...req.body };
  await escribirJSON("tareas.json", tareas);
  res.json(tareas[index]);
});

app.delete("/tareas/:id", auth, async (req, res) => {
  const tareas = await leerJSON("tareas.json");
  const id = Number(req.params.id);

  const nuevas = tareas.filter(t => t.id !== id);
  await escribirJSON("tareas.json", nuevas);

  res.json({ message: "Tarea eliminada" });
});

// --------------------
// USUARIOS (Ruta agregada y verificada)
// --------------------
app.get("/usuarios", auth, async (req, res) => {
  const usuarios = await leerJSON("usuarios.json");
  // Retornamos lista limpia sin contraseñas
  const listaLimpia = usuarios.map(u => ({ username: u.username }));
  res.json(listaLimpia);
});
// --- PEGA LA PRUEBA AQUÍ ---
app.get("/test-usuarios", async (req, res) => {
    const usuarios = await leerJSON("usuarios.json");
    res.json(usuarios);
});

// --------------------
// ERROR HANDLER
// --------------------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(PORT, () =>
  console.log(`
  ✅ Servidor activo en http://localhost:${PORT}
  Rutas disponibles:
  - GET  /            (Prueba de conexión)
  - POST /register    (Registro)
  - POST /login       (Login)
  - GET  /tareas      (Ver todas)
  - GET  /usuarios    (Ver lista de usuarios)
  `)
);