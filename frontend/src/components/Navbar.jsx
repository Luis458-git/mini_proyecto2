import React from 'react';
import { MessageSquare, LayoutDashboard, User, LogOut, ShieldCheck, RefreshCw } from 'lucide-react';

export default function Navbar({ usuario, pestanaActiva, setPestanaActiva, onOpenLogin, onLogout }) {
  const esRRHH = usuario && (usuario.rol === 'rrhh' || usuario.rol === 'admin');

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y título de la empresa */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
              TT
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">TicoTech</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  CR 🇨🇷
                </span>
              </div>
              <p className="text-xs text-slate-500">Portal de Políticas de RRHH & IA</p>
            </div>
          </div>

          {/* Pestañas de Navegación protegidas por rol */}
          <nav className="hidden md:flex space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setPestanaActiva('chat')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pestanaActiva === 'chat'
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>TicoBot RRHH</span>
            </button>

            {esRRHH && (
              <button
                onClick={() => setPestanaActiva('dashboard')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pestanaActiva === 'dashboard'
                    ? 'bg-white text-blue-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard RRHH</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold border border-amber-300">
                  RRHH
                </span>
              </button>
            )}
          </nav>

          {/* Cabecera de Contexto del Colaborador Logueado */}
          <div className="flex items-center space-x-3">
            {usuario ? (
              <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs border border-slate-300">
                  {usuario.nombre ? usuario.nombre.slice(0, 2).toUpperCase() : 'US'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm font-bold text-slate-800 leading-tight">{usuario.nombre}</span>
                    <span
                      className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold ${
                        usuario.rol === 'rrhh' || usuario.rol === 'admin'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {usuario.rol}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-tight">
                    {usuario.departamento || 'Colaborador'}
                  </p>
                </div>
                <button
                  onClick={onOpenLogin}
                  title="Cambiar perfil demo"
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={onLogout}
                  title="Cerrar sesión"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow"
              >
                Iniciar Sesión Demo
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
