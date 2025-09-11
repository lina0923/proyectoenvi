import React, { useState } from 'react';

export default function LoginForm({ setView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      setMsg(data.message || 'Respuesta recibida');

      if (res.ok && data.user) {
        if (data.user.role == 'admin') window.location.href = '/admin.html';
        else window.location.href = '/usuario.html';
      }
    } catch (err) {
      setMsg('Error de conexión: ' + err.message);
    }
  }

  return (
    <div>
      <h2>Iniciar Sesión</h2>
      {msg && <p>{msg}</p>}
      <form onSubmit={submit}>
        <input type="email" placeholder="Correo" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button type="submit">Iniciar sesión</button>
      </form>
      <p>
        ¿No tienes cuenta? <button onClick={()=>setView('register')}>Regístrate</button>
      </p>
    </div>
  );
}
