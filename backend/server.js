// ------------------ IMPORTS ------------------
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs"); // Encriptacion
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ------------------ MULTER ------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Servir carpeta uploads
app.use("/uploads", express.static("uploads"));

// ------------------ MYSQL ------------------
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "proyecto_ventas",
});

db.connect((err) => {
  if (err) console.error("Error de conexion a MySQL:", err);
  else console.log("Conectado a MySQL");
});

// ------------------ REGISTER ------------------
app.post("/register", (req, res) => {
  const { nombre, email, password, role } = req.body;
  if (!nombre || !email || !password || !role)
    return res.status(400).json({ message: "Faltan datos para registrar" });

  const hashedPassword = bcrypt.hashSync(password, 10);
  const sql =
    "INSERT INTO usuarios (nombre, email, password, role) VALUES (?, ?, ?, ?)";
  db.query(sql, [nombre, email, hashedPassword, role], (err, result) => {
    if (err) return res.status(500).json({ message: "Error al registrar usuario" });
    res.json({ message: "Usuario registrado con exito", userId: result.insertId });
  });
});

// ------------------ LOGIN ------------------
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Faltan datos" });

  const sql = "SELECT * FROM usuarios WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ message: "Error en la base de datos" });
    if (results.length === 0) return res.status(401).json({ message: "Credenciales invalidas" });

    const user = results[0];
    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return res.status(401).json({ message: "Credenciales invalidas" });

    res.json({ message: "Login exitoso", user: { id: user.id, email: user.email, role: user.role } });
  });
});

// ------------------ PRODUCTOS ------------------
// Listar productos
app.get("/productos", (req, res) => {
  db.query("SELECT * FROM productos", (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
});

// Agregar producto
app.post("/productos", upload.single("imagen"), (req, res) => {
  const { nombre, precio, cantidad, descripcion } = req.body;
  const imagen = req.file ? "/uploads/" + req.file.filename : null;

  if (!nombre || !precio || !cantidad)
    return res.status(400).json({ message: "Faltan datos obligatorios" });

  db.query(
    "INSERT INTO productos (nombre, precio, cantidad, descripcion, imagen) VALUES (?, ?, ?, ?, ?)",
    [nombre, precio, cantidad, descripcion, imagen],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Producto agregado", id: result.insertId });
    }
  );
});

// Editar producto
app.put("/productos/:id", upload.single("imagen"), (req, res) => {
  const { nombre, precio, cantidad, descripcion } = req.body;
  let sql =
    "UPDATE productos SET nombre=?, precio=?, cantidad=?, descripcion=? WHERE id=?";
  let values = [nombre, precio, cantidad, descripcion, req.params.id];

  if (req.file) {
    sql =
      "UPDATE productos SET nombre=?, precio=?, cantidad=?, descripcion=?, imagen=? WHERE id=?";
    values = [
      nombre,
      precio,
      cantidad,
      descripcion,
      "/uploads/" + req.file.filename,
      req.params.id,
    ];
  }

  db.query(sql, values, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Producto actualizado" });
  });
});

// Eliminar producto
app.delete("/productos/:id", (req, res) => {
  db.query("DELETE FROM productos WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Producto eliminado" });
  });
});

// ------------------ PEDIDOS ------------------
// Listar pedidos con join para mostrar nombre del producto y cliente
app.get("/pedidos", (req, res) => {
  const sql = `
    SELECT pe.id, pe.nombre AS cliente, pr.nombre AS producto,
           pe.cantidad, pe.direccion, pe.telefono, pe.correo,
           pe.estado, pe.conductor, pe.fecha
    FROM pedidos pe
    LEFT JOIN productos pr ON pe.producto_id = pr.id
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
});

// Crear pedido
app.post("/pedidos", (req, res) => {
  const { producto_id, nombre, direccion, telefono, correo, cantidad, estado, conductor } = req.body;

  const sql = `
    INSERT INTO pedidos (producto_id, nombre_producto, nombre, direccion, telefono, correo, cantidad, estado, conductor) 
    VALUES (?, (SELECT nombre FROM productos WHERE id=?), ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [producto_id, producto_id, nombre, direccion, telefono, correo, cantidad, estado, conductor], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Pedido creado", id: result.insertId });
  });
});

// Actualizar estado del pedido
app.put("/pedidos/:id/estado", (req, res) => {
  const { estado } = req.body;
  db.query("UPDATE pedidos SET estado=? WHERE id=?", [estado, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Estado actualizado" });
  });
});

// Actualizar conductor
app.put("/pedidos/:id/conductor", (req, res) => {
  const { conductor } = req.body;
  db.query("UPDATE pedidos SET conductor=? WHERE id=?", [conductor, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Conductor actualizado" });
  });
});

// ------------------ SERVER ------------------
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
