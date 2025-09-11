const express = require("express");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "proyecto_ventas"
});

db.connect(err => {
  if (err) throw err;
  console.log("Conectado a la base de datos MySQL");

  db.query(`
    CREATE TABLE IF NOT EXISTS productos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      precio DECIMAL(10,2) NOT NULL,
      cantidad INT NOT NULL,
      descripcion TEXT,
      imagen VARCHAR(255)
    );
  `);

  db.query(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      producto_id INT NOT NULL,
      nombre VARCHAR(255) NOT NULL,
      direccion VARCHAR(255) NOT NULL,
      telefono VARCHAR(50) NOT NULL,
      correo VARCHAR(255) NOT NULL,
      cantidad INT NOT NULL,
      estado VARCHAR(50) DEFAULT 'Pendiente',
      FOREIGN KEY (producto_id) REFERENCES productos(id)
    );
  `);
});

// ---------------- CRUD PRODUCTOS ----------------
app.post("/productos", upload.single("imagen"), (req, res) => {
  const { nombre, precio, cantidad, descripcion } = req.body;
  if (!req.file) return res.status(400).json({ error: "Se requiere imagen" });
  const imagen = `/uploads/${req.file.filename}`;

  db.query(
    "INSERT INTO productos (nombre, precio, cantidad, descripcion, imagen) VALUES (?, ?, ?, ?, ?)",
    [nombre, precio, cantidad, descripcion, imagen],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Producto agregado", id: result.insertId });
    }
  );
});

app.get("/productos", (req, res) => {
  db.query("SELECT * FROM productos", (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows);
  });
});

app.put("/productos/:id", upload.single("imagen"), (req, res) => {
  const { id } = req.params;
  const { nombre, precio, cantidad, descripcion } = req.body;
  const imagen = req.file ? `/uploads/${req.file.filename}` : req.body.imagen;

  db.query(
    "UPDATE productos SET nombre=?, precio=?, cantidad=?, descripcion=?, imagen=? WHERE id=?",
    [nombre, precio, cantidad, descripcion, imagen, id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Producto actualizado" });
    }
  );
});

app.delete("/productos/:id", (req, res) => {
  db.query("DELETE FROM productos WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Producto eliminado" });
  });
});

// ---------------- REGISTRAR PEDIDO ----------------
app.post("/pedidos", (req, res) => {
  const { producto_id, nombre, direccion, telefono, correo, cantidad } = req.body;
  if (!producto_id || !nombre || !direccion || !telefono || !correo || !cantidad) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  db.query(
    "SELECT cantidad FROM productos WHERE id=?",
    [producto_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err });
      if (!rows.length) return res.status(404).json({ error: "Producto no encontrado" });

      const disponible = rows[0].cantidad;
      if (disponible < cantidad) return res.status(400).json({ error: "Cantidad insuficiente" });

      db.query(
        "INSERT INTO pedidos (producto_id, nombre, direccion, telefono, correo, cantidad) VALUES (?, ?, ?, ?, ?, ?)",
        [producto_id, nombre, direccion, telefono, correo, cantidad],
        (err, result) => {
          if (err) return res.status(500).json({ error: err });

          db.query(
            "UPDATE productos SET cantidad = cantidad - ? WHERE id=?",
            [cantidad, producto_id],
            (err2) => {
              if (err2) return res.status(500).json({ error: err2 });
              res.json({ message: "Pedido registrado", pedidoId: result.insertId });
            }
          );
        }
      );
    }
  );
});

// ---------------- LISTAR PEDIDOS ----------------
app.get("/mispedidos", (req, res) => {
  db.query(
    "SELECT p.id, pr.nombre AS producto, p.nombre, p.direccion, p.telefono, p.correo, p.cantidad, p.estado FROM pedidos p JOIN productos pr ON p.producto_id=pr.id ORDER BY p.id DESC",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err });
      res.json(rows);
    }
  );
});

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
