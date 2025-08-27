const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Conexión a la base de datos SQLite
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) console.error(err);
  else console.log('Base de datos conectada');
});



// Registro
app.post('/register', async (req, res) => {
  console.log(req.body); // Verifica lo que llega del frontend
  const { nombre, email, password, role } = req.body;
  if (!nombre || !email || !password || !role) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const query = `INSERT INTO usuarios (nombre, email, password, role) VALUES (?, ?, ?, ?)`;
  db.run(query, [nombre, email, hashedPassword, role], function(err) {
    if (err) return res.status(500).json({ message: 'Error al registrar: ' + err.message });
    res.json({ message: 'Usuario registrado correctamente' });
  });
});

// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Correo y contraseña requeridos' });

  const query = `SELECT * FROM usuarios WHERE email = ?`;
  db.get(query, [email], async (err, row) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!row) return res.status(404).json({ message: 'Usuario no encontrado' });

    const match = await bcrypt.compare(password, row.password);
    if (!match) return res.status(401).json({ message: 'Contraseña incorrecta' });

    res.json({ message: 'Login exitoso', user: { nombre: row.nombre, email: row.email, role: row.role } });
  });
});

app.listen(4000, () => console.log('Servidor corriendo en http://localhost:4000'));
