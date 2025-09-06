const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const cors = require("cors");

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Servir imágenes
app.use(session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true
}));

// Configuración de subida de imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Conexión a SQLite
const db = new sqlite3.Database("./login_db.db", (err) => {
    if (err) console.error("Error al conectar DB:", err);
    else console.log("Conectado a la base de datos login_db");
});

// Crear tablas si no existen
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        rol TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        precio REAL NOT NULL,
        imagen TEXT
    )`);
});

// -------------------- RUTAS --------------------

// Registro
app.post("/register", async (req, res) => {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password || !rol) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(`INSERT INTO users (nombre, email, password, rol) VALUES (?, ?, ?, ?)`,
        [nombre, email, hashedPassword, rol],
        function (err) {
            if (err) return res.status(500).json({ error: "Error al registrar usuario" });
            res.json({ message: "Usuario registrado correctamente", userId: this.lastID });
        });
});

// Login
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err) return res.status(500).json({ error: "Error en el servidor" });
        if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: "Contraseña incorrecta" });

        req.session.user = { id: user.id, rol: user.rol };
        res.json({ message: "Login exitoso", rol: user.rol });
    });
});

// Logout
app.post("/logout", (req, res) => {
    req.session.destroy();
    res.json({ message: "Sesión cerrada" });
});

// ---------------- CRUD Productos ----------------

// Crear producto con imagen
app.post("/productos", upload.single("imagen"), (req, res) => {
    const { nombre, precio } = req.body;
    const imagen = req.file ? `/uploads/${req.file.filename}` : null;

    if (!nombre || !precio) {
        return res.status(400).json({ error: "Nombre y precio son obligatorios" });
    }

    db.run(`INSERT INTO productos (nombre, precio, imagen) VALUES (?, ?, ?)`,
        [nombre, precio, imagen],
        function (err) {
            if (err) return res.status(500).json({ error: "Error al agregar producto" });
            res.json({ message: "Producto agregado", id: this.lastID });
        });
});

// Obtener todos los productos
app.get("/productos", (req, res) => {
    db.all(`SELECT * FROM productos`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Error al obtener productos" });
        res.json(rows);
    });
});

// Actualizar producto
app.put("/productos/:id", upload.single("imagen"), (req, res) => {
    const { id } = req.params;
    const { nombre, precio } = req.body;
    const imagen = req.file ? `/uploads/${req.file.filename}` : req.body.imagen;

    db.run(`UPDATE productos SET nombre = ?, precio = ?, imagen = ? WHERE id = ?`,
        [nombre, precio, imagen, id],
        function (err) {
            if (err) return res.status(500).json({ error: "Error al actualizar producto" });
            res.json({ message: "Producto actualizado" });
        });
});

// Eliminar producto
app.delete("/productos/:id", (req, res) => {
    const { id } = req.params;

    db.run(`DELETE FROM productos WHERE id = ?`, [id], function (err) {
        if (err) return res.status(500).json({ error: "Error al eliminar producto" });
        res.json({ message: "Producto eliminado" });
    });
});

// -------------------- INICIAR SERVER --------------------
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
