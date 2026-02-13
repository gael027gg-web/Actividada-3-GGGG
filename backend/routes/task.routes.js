const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const taskController = require("../controllers/task.controller");

router.get("/", auth, taskController.obtenerTasks);
router.post("/", auth, taskController.crearTask);
router.put("/:id", auth, taskController.actualizarTask);
router.delete("/:id", auth, taskController.eliminarTask);

module.exports = router;
