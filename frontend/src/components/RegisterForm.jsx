import React, { useState } from 'react';

export default function RegisterForm({ setView }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // valor por defecto
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch('http://localhost:4000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password, role })
      });
      const data = await res.json();
      setMsg(data.message || 'Respuesta recibida');
      if (res.ok) setView('login');
    } catch (err) {
      setMsg('Error de conexión: ' + err.message);
    }
  };

  return (
    <div>
      <h2>Registro</h2>
      {msg && <p>{msg}</p>}
      <form onSubmit={submit}>
        <input type="text" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
        <input type="email" placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
        <select value={role} onChange={e => setRole(e.target.value)} required>
          <option value="user">Usuario</option>
          <option value="admin">Administrador</option>
        </select>
        <button type="submit">Registrarse</button>
      </form>
      <p>
        ¿Ya tienes cuenta? <button onClick={() => setView('login')}>Inicia sesión</button>
      </p>
    </div>
  );
}
