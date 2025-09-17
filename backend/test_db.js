const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // pon la contraseña correcta si tiene
  database: "proyecto_ventas"
});

db.connect(err => {
  if (err) {
    console.error("❌ Error al conectar:", err.message);
    return;
  }
  console.log("✅ Conexión exitosa a MySQL");
  db.end();
});
