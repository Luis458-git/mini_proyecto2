import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import ChatView from './components/ChatView.jsx';
import DashboardView from './components/DashboardView.jsx';
import LoginModal from './components/LoginModal.jsx';

export default function App() {
  // Usuario autenticado por defecto para iniciar directamente la demo
  const [usuario, setUsuario] = useState({
    id: 3,
    nombre: 'Andrés Monge Villalobos',
    email: 'andres.monge@ticotech.cr',
    rol: 'colaborador',
    departamento: 'Ingeniería de Software',
    puesto: 'Engineering Manager',
  });

  const [pestanaActiva, setPestanaActiva] = useState('chat');
  const [modalLoginAbierto, setModalLoginAbierto] = useState(false);

  // Protección de Rutas (RF-FE-02):
  // Si el usuario cambia a 'colaborador' y estaba en 'dashboard', se redirige forzosamente a 'chat'
  useEffect(() => {
    if (usuario && usuario.rol !== 'rrhh' && usuario.rol !== 'admin' && pestanaActiva === 'dashboard') {
      setPestanaActiva('chat');
    }
  }, [usuario, pestanaActiva]);

  const handleSelectUser = async (perfil) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: perfil.id }),
      });
      const data = await res.json();
      if (data.ok && data.user) {
        setUsuario(data.user);
        if (data.user.rol === 'rrhh') {
          setPestanaActiva('dashboard');
        } else {
          setPestanaActiva('chat');
        }
      } else {
        // Fallback local si el backend estuviera desconectado
        setUsuario({ ...perfil });
      }
    } catch {
      setUsuario({ ...perfil });
    }
  };

  const handleLogout = () => {
    setUsuario(null);
    setModalLoginAbierto(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Navbar
        usuario={usuario}
        pestanaActiva={pestanaActiva}
        setPestanaActiva={setPestanaActiva}
        onOpenLogin={() => setModalLoginAbierto(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {pestanaActiva === 'chat' ? (
          <ChatView usuario={usuario} />
        ) : usuario?.rol === 'rrhh' || usuario?.rol === 'admin' ? (
          <DashboardView usuario={usuario} />
        ) : (
          <div className="max-w-md mx-auto my-12 bg-white p-6 rounded-2xl border border-rose-200 text-center space-y-3">
            <h3 className="font-bold text-rose-700">Acceso Denegado (403)</h3>
            <p className="text-xs text-slate-600">
              Esta sección requiere permisos del departamento de Recursos Humanos.
            </p>
            <button
              onClick={() => setPestanaActiva('chat')}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
            >
              Regresar al Chat
            </button>
          </div>
        )}
      </main>

      <LoginModal
        isOpen={modalLoginAbierto}
        onClose={() => setModalLoginAbierto(false)}
        onSelectUser={handleSelectUser}
      />
    </div>
  );
}
