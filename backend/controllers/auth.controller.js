const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// --------------------
// REGISTER (MongoDB)
// --------------------
async function register(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const existe = await User.findOne({ username });
    if (existe) {
      return res.status(400).json({ error: "Usuario existente" });
    }

    const hash = await bcrypt.hash(password, 10);

    const nuevo = new User({
      username,
      password: hash
    });

    await nuevo.save();

    res.json({ message: "Usuario creado en MongoDB" });

  } catch (error) {
    res.status(500).json({ error: "Error al registrar" });
  }
}

// --------------------
// LOGIN (MongoDB)
// --------------------
async function login(req, res) {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });

  } catch (error) {
    res.status(500).json({ error: "Error en login" });
  }
}

module.exports = { register, login };
