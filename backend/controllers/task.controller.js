const Task = require("../models/Task");

// Crear tarea
exports.crearTask = async (req, res) => {
  try {
    const task = await Task.create({
      ...req.body,
      creador: req.user.username
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Error creando tarea" });
  }
};

// Obtener todas
exports.obtenerTasks = async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
};

// Actualizar
exports.actualizarTask = async (req, res) => {
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  if (!task) return res.status(404).json({ error: "No encontrada" });

  res.json(task);
};

// Eliminar
exports.eliminarTask = async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: "Eliminada" });
};
