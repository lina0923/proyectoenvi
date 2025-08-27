import React, { useState } from 'react'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'

export default function App(){
  const [view, setView] = useState('login') // 'login' o 'register'
  return (
    <div className="container">
      <div className="card">
        {view === 'login' ? <LoginForm setView={setView} /> : <RegisterForm setView={setView} />}
      </div>
    </div>
  )
}
