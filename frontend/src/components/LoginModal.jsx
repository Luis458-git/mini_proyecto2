import React, { useState } from 'react';
import { UserCheck, ShieldAlert, Sparkles, X } from 'lucide-react';

const PERFILES_RAPIDOS = [
  {
    id: 3,
    nombre: 'Andrés Monge Villalobos',
    rol: 'colaborador',
    departamento: 'Ingeniería de Software',
    puesto: 'Engineering Manager',
    descripcion: 'Perfil colaborador estándar (solo consulta sus datos y políticas generales).',
  },
  {
    id: 2,
    nombre: 'Valeria Quesada Brenes',
    rol: 'rrhh',
    departamento: 'Talento Humano',
    puesto: 'Gerente de Talento Humano',
    descripcion: 'Perfil con acceso completo al Dashboard de RRHH, analítica y reportes diarios.',
  },
  {
    id: 6,
    nombre: 'Daniela Mora Cordero',
    rol: 'rrhh',
    departamento: 'Talento Humano',
    puesto: 'Especialista de RRHH y Nómina',
    descripcion: 'Perfil RRHH operativo con permisos para gestionar solicitudes y auditoría.',
  },
  {
    id: 9,
    nombre: 'Alejandro Vargas Castro',
    rol: 'colaborador',
    departamento: 'Ingeniería de Software',
    puesto: 'Senior Backend Developer',
    descripcion: 'Colaborador en modalidad teletrabajo (ideal para probar políticas de jornada).',
  },
];

export default function LoginModal({ isOpen, onClose, onSelectUser }) {
  const [customId, setCustomId] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span className="text-xs font-semibold tracking-wider uppercase text-blue-200">
              Evaluación & Demostración RAG
            </span>
          </div>
          <h2 className="text-xl font-bold mt-1">Seleccionar Perfil de Usuario</h2>
          <p className="text-sm text-blue-100 mt-1">
            Cambia entre perfiles para validar el control de acceso por roles y las restricciones de privacidad (Ley 8968).
          </p>
        </div>

        {/* Lista de perfiles rápidos */}
        <div className="p-6 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Perfiles de prueba preconfigurados
          </p>

          <div className="space-y-2">
            {PERFILES_RAPIDOS.map((perfil) => (
              <button
                key={perfil.id}
                onClick={() => {
                  onSelectUser(perfil);
                  onClose();
                }}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex items-start space-x-3 group"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    perfil.rol === 'rrhh'
                      ? 'bg-purple-100 text-purple-700 border border-purple-200 group-hover:bg-purple-200'
                      : 'bg-blue-100 text-blue-700 border border-blue-200 group-hover:bg-blue-200'
                  }`}
                >
                  {perfil.nombre.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 group-hover:text-blue-600 truncate text-sm">
                      {perfil.nombre}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        perfil.rol === 'rrhh'
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {perfil.rol}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {perfil.puesto} • {perfil.departamento}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{perfil.descripcion}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Selector por ID libre */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              O ingresar con ID de colaborador (1 al 50):
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                min="1"
                max="50"
                placeholder="Ej. 15"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  if (customId) {
                    onSelectUser({ id: Number(customId) });
                    onClose();
                  }
                }}
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
              >
                Cargar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
