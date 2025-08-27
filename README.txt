Proyecto 'login-app' preparado por ChatGPT para Lina.

Instrucciones rápidas:

1) Importa el archivo backend/db.sql en phpMyAdmin o ejecuta su contenido en MySQL para crear la base de datos y la tabla.
   - Archivo: backend/db.sql

2) Backend (Node + Express)
   - Abre terminal en la carpeta backend/
   - Ejecuta: npm install
   - Luego: npm start
   - Asegúrate de que MySQL esté corriendo (XAMPP). Si tu usuario/clave son diferentes, edita backend/server.js en la configuración de conexión.

3) Frontend (Vite + React)
   - Abre terminal en la carpeta frontend/
   - Ejecuta: npm install
   - Luego: npm run dev
   - Abre el URL que Vite muestre (por ejemplo http://localhost:5173)

4) Prueba
   - Regístrate y luego inicia sesión. El backend guarda en MySQL. Si todo está en la misma máquina, las llamadas a http://localhost:4000 funcionarán.
