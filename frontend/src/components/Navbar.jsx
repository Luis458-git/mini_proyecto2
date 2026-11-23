import React from 'react';
import {
  MessageSquare,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Building2,
} from 'lucide-react';

export default function Navbar({ usuario, pestanaActiva, setPestanaActiva, onOpenLogin, onLogout }) {
  const esRRHH = usuario && (usuario.rol === 'rrhh' || usuario.rol === 'admin');

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y título de la empresa */}
          <div className="flex items-center space-x-3.5">
            <div className="relative group cursor-pointer" onClick={() => setPestanaActiva('chat')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 flex items-center justify-center text-white font-black text-base shadow-md shadow-blue-600/25 group-hover:scale-105 transition-transform">
                TT
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" title="Sistema Multiagente Activo"></span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  TicoTech
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border border-blue-200/80 shadow-2xs">
                  CR 🇨🇷
                </span>
                <span className="hidden lg:inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                  <span>RAG + Drive Live</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium flex items-center space-x-1">
                <Building2 className="w-3 h-3 text-slate-400 inline" />
                <span>Portal Inteligente de Políticas de RRHH & Código de Trabajo</span>
              </p>
            </div>
          </div>

          {/* Pestañas de Navegación protegidas por rol */}
          <nav className="flex space-x-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setPestanaActiva('chat')}
              className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                pestanaActiva === 'chat'
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>TicoBot RRHH</span>
            </button>

            {esRRHH && (
              <button
                onClick={() => setPestanaActiva('dashboard')}
                className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  pestanaActiva === 'dashboard'
                    ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/70'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard RRHH</span>
                <span className="hidden sm:inline-block ml-1 text-[10px] px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 font-bold border border-amber-300/80">
                  Admin
                </span>
              </button>
            )}
          </nav>

          {/* Cabecera de Contexto del Colaborador Logueado */}
          <div className="flex items-center space-x-2.5">
            {usuario ? (
              <div className="flex items-center space-x-2.5 bg-slate-50/90 hover:bg-slate-100/80 border border-slate-200/90 rounded-xl px-2.5 py-1.5 transition-colors">
                <div
                  onClick={onOpenLogin}
                  title="Haz clic para cambiar de perfil"
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer transition-transform hover:scale-105 ${
                    esRRHH
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white'
                      : 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white'
                  }`}
                >
                  {usuario.nombre ? usuario.nombre.slice(0, 2).toUpperCase() : 'US'}
                </div>

                <div className="text-left hidden md:block cursor-pointer" onClick={onOpenLogin}>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      {usuario.nombre}
                    </span>
                    <span
                      className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-extrabold flex items-center space-x-0.5 ${
                        esRRHH
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <ShieldCheck className="w-2.5 h-2.5 mr-0.5 inline" />
                      <span>{usuario.rol}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight truncate max-w-[160px]">
                    {usuario.puesto || usuario.departamento || 'Colaborador'}
                  </p>
                </div>

                <div className="flex items-center border-l border-slate-200 pl-1.5 space-x-1">
                  <button
                    onClick={onOpenLogin}
                    title="Cambiar perfil de demostración"
                    className="flex items-center space-x-1 px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/70 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Cambiar</span>
                  </button>
                  <button
                    onClick={onLogout}
                    title="Cerrar sesión"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition shadow-md shadow-blue-500/20"
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
