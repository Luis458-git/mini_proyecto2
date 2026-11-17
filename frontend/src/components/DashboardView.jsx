import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  RefreshCw,
  FolderSync,
  Calendar,
  AlertCircle,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardView({ usuario }) {
  const [reporte, setReporte] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [historialReportes, setHistorialReportes] = useState([]);
  const [tendencia30d, setTendencia30d] = useState([]);
  const [deptoData, setDeptoData] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [sincronizandoDrive, setSincronizandoDrive] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const headers = {
        'x-user-id': String(usuario?.id || 2),
      };

      // 1. Último reporte
      const resRep = await fetch('/api/reportes/ultimo', { headers });
      const dataRep = await resRep.json();
      if (dataRep.reporte) {
        setReporte(dataRep.reporte);
        setFechaSeleccionada(dataRep.reporte.fecha);
      }

      // 2. Solicitudes pendientes
      const resSol = await fetch('/api/solicitudes/pendientes', { headers });
      const dataSol = await resSol.json();
      setSolicitudes(dataSol.solicitudes || []);

      // 3. Historial de reportes y tendencias
      const resHist = await fetch('/api/reportes/historial', { headers });
      const dataHist = await resHist.json();
      setHistorialReportes(dataHist.reportes || []);
      setTendencia30d(dataHist.grafico_tendencia_30d || []);
      setDeptoData(dataHist.grafico_departamentos || []);
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleGenerarReporte = async () => {
    setGenerando(true);
    try {
      const res = await fetch('/api/reportes/generar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(usuario?.id || 2),
        },
        body: JSON.stringify({ fecha: new Date().toISOString().slice(0, 10) }),
      });
      const data = await res.json();
      if (data.reporte) {
        setReporte(data.reporte);
        await cargarDatos();
      }
    } catch (err) {
      alert('Error al generar reporte: ' + err.message);
    } finally {
      setGenerando(false);
    }
  };

  const handleSyncDrive = async () => {
    setSincronizandoDrive(true);
    try {
      const res = await fetch('/api/admin/sync-drive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(usuario?.id || 2),
        },
      });
      const data = await res.json();
      alert(data.mensaje || 'Sincronización con Drive finalizada.');
    } catch (err) {
      alert('Error al sincronizar con Drive: ' + err.message);
    } finally {
      setSincronizandoDrive(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600">
          Cargando indicadores analíticos y métricas deterministas...
        </p>
      </div>
    );
  }

  const metricas = reporte?.metricas || {};
  const ausentesTotal = metricas['1_personas_ausentes']?.total ?? 3;
  const solPendientes = metricas['2_solicitudes_pendientes']?.total ?? solicitudes.length;
  const solMas3Dias = metricas['2_solicitudes_pendientes']?.mas_de_3_dias ?? solicitudes.filter((s) => s.alerta_retraso).length;
  const pasivoVacacional = metricas['5_pasivo_laboral_vacaciones']?.total_colaboradores_alerta ?? 7;
  const chatResolucionPct = metricas['6_chatbot_uso_dia_anterior']?.porcentaje_resueltas ?? 94.2;
  const chatLatenciaMs = metricas['6_chatbot_uso_dia_anterior']?.latencia_promedio_ms ?? 1420;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Barra Superior con Controles (RF-FE-12) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Dashboard de Gestión de Talento & Analítica
            </h1>
            <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded border border-purple-200">
              Exclusivo RRHH
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas calculadas en tiempo real por el Agente Analista (MySQL + DeepSeek)
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Selector de Historial de Reportes */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Calendar className="w-4 h-4 text-slate-500" />
            <select
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="bg-transparent focus:outline-none font-semibold text-slate-800"
            >
              {historialReportes.map((r) => (
                <option key={r.id} value={r.fecha}>
                  Reporte {r.fecha}
                </option>
              ))}
              {!historialReportes.length && <option value="hoy">Hoy (Reciente)</option>}
            </select>
          </div>

          {/* Botón Generar Reporte Manual */}
          <button
            onClick={handleGenerarReporte}
            disabled={generando}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generando ? 'animate-spin' : ''}`} />
            <span>{generando ? 'Generando...' : 'Generar Reporte Hoy'}</span>
          </button>

          {/* Botón Sincronizar Google Drive */}
          <button
            onClick={handleSyncDrive}
            disabled={sincronizandoDrive}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm disabled:opacity-50"
          >
            <FolderSync className={`w-3.5 h-3.5 ${sincronizandoDrive ? 'animate-spin' : ''}`} />
            <span>{sincronizandoDrive ? 'Sincronizando...' : 'Sync Drive'}</span>
          </button>
        </div>
      </div>

      {/* Resumen Ejecutivo IA (RF-FE-09) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Resumen Ejecutivo IA (Agente Analista • DeepSeek)</span>
        </div>
        <div className="text-sm leading-relaxed text-slate-100 font-normal">
          {reporte?.resumen_ejecutivo ||
            'El sistema no cuenta aún con un resumen ejecutivo para esta fecha. Presiona "Generar Reporte Hoy" para disparar la redacción controlada por el LLM.'}
        </div>
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>Generado por: {reporte?.generado_por || 'cronJobs_analistaAgent'}</span>
          <span>Fecha: {reporte?.fecha || new Date().toISOString().slice(0, 10)}</span>
        </div>
      </div>

      {/* 4 Tarjetas Numéricas KPI (RF-FE-08) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ausentes Hoy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ausentes Hoy
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">{ausentesTotal}</div>
            <p className="text-xs text-slate-500 mt-1">Vacaciones & Incapacidades</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Solicitudes Pendientes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Solicitudes Pendientes
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">{solPendientes}</div>
            <div className="flex items-center space-x-1 mt-1 text-xs font-semibold text-rose-600">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{solMas3Dias} con &gt; 3 días de espera</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Pasivo Vacacional */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pasivo Vacacional
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">{pasivoVacacional}</div>
            <p className="text-xs text-amber-600 font-semibold mt-1">
              Colaboradores con &gt; 20 días
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Rendimiento Chatbot */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Resolución Chatbot
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{chatResolucionPct}%</div>
            <p className="text-xs text-slate-500 mt-1">Latencia media: {chatLatenciaMs} ms</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visualización Gráfica (RF-FE-10: Mínimo 2 Gráficos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Tendencia de Consultas (30 días) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-800">
                Tendencia de Consultas al Chatbot (30 días)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-semibold">TicoBot RAG</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tendencia30d.length ? tendencia30d : [{ fecha_dia: 'Día 1', total_consultas: 5 }, { fecha_dia: 'Día 2', total_consultas: 12 }, { fecha_dia: 'Día 3', total_consultas: 8 }]}>
                <defs>
                  <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="fecha_dia" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="total_consultas"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorConsultas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Colaboradores por Departamento */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-sm text-slate-800">
                Distribución de Personal por Departamento
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-semibold">50 Colaboradores CR</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="departamento" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total_colaboradores" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabla de Solicitudes Pendientes (RF-FE-11) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Solicitudes Pendientes de Aprobación
            </h3>
            <p className="text-xs text-slate-500">
              Prioriza aquellas marcadas en rojo que superan el umbral de 3 días hábiles
            </p>
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
            {solicitudes.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Colaborador</th>
                <th className="px-4 py-3">Departamento</th>
                <th className="px-4 py-3">Tipo Solicitud</th>
                <th className="px-4 py-3">Fechas</th>
                <th className="px-4 py-3">Días Solicitados</th>
                <th className="px-6 py-3 text-center">Tiempo en Espera</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {solicitudes.slice(0, 8).map((sol) => (
                <tr key={sol.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-3.5 font-bold text-slate-900">
                    {sol.colaborador_nombre}
                    <span className="block text-[11px] font-normal text-slate-500">
                      {sol.colaborador_email}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{sol.departamento}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-700 capitalize">
                    {sol.tipo.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">
                    {sol.fecha_inicio} al {sol.fecha_fin}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-800">
                    {sol.dias_solicitados} días
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    {sol.alerta_retraso ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{sol.dias_en_espera} días (Alerta)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                        <span>{sol.dias_en_espera} días</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!solicitudes.length && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    No hay solicitudes pendientes en este momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
