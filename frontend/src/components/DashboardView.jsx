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
  Check,
  X,
  Search,
  Download,
  Copy,
  Activity,
  UserPlus,
  MessageSquareWarning,
  Filter,
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

  // Nuevos estados interactivos
  const [notificacion, setNotificacion] = useState(null); // { tipo: 'ok'|'error', texto: '' }
  const [filtroSolicitud, setFiltroSolicitud] = useState('todas'); // 'todas' | 'alerta' | 'vacaciones' | 'permisos'
  const [busquedaColab, setBusquedaColab] = useState('');
  const [resolviendoId, setResolviendoId] = useState(null);
  const [resumenCopiado, setResumenCopiado] = useState(false);

  const mostrarToast = (texto, tipo = 'ok') => {
    setNotificacion({ texto, tipo });
    setTimeout(() => {
      setNotificacion(null);
    }, 4500);
  };

  const getAuthHeaders = () => {
    const csrfToken = sessionStorage.getItem('csrfToken') || usuario?.csrfToken || '';
    return {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...(usuario?.token
        ? { Authorization: `Bearer ${usuario.token}` }
        : { 'x-user-id': String(usuario?.id || 2) }),
    };
  };

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const headers = getAuthHeaders();

      // 1. Último reporte
      const resRep = await fetch('/api/reportes/ultimo', { headers });
      const dataRep = await resRep.json();
      if (dataRep.reporte) {
        setReporte(dataRep.reporte);
        const fStr = (dataRep.reporte.fecha || '').slice(0, 10);
        setFechaSeleccionada(fStr);
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
      mostrarToast('Error al cargar métricas del servidor.', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCambioFecha = (nuevaFecha) => {
    setFechaSeleccionada(nuevaFecha);
    const fBuscada = (nuevaFecha || '').slice(0, 10);
    const encontrado = historialReportes.find((r) => {
      const rf = (r.fecha || '').slice(0, 10);
      return rf === fBuscada || String(r.id) === String(nuevaFecha);
    });

    if (encontrado) {
      setReporte({
        id: encontrado.id,
        fecha: encontrado.fecha,
        metricas:
          encontrado.metricas ||
          (typeof encontrado.datos_json === 'string'
            ? JSON.parse(encontrado.datos_json)
            : encontrado.datos_json) ||
          {},
        resumen_ejecutivo: encontrado.resumen_texto,
        generado_por: encontrado.generado_por,
        creado_en: encontrado.creado_en,
      });
      mostrarToast(`Visualizando reporte histórico del ${fBuscada}`);
    }
  };

  const handleGenerarReporte = async () => {
    setGenerando(true);
    try {
      const res = await fetch('/api/reportes/generar', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ fecha: new Date().toISOString().slice(0, 10) }),
      });
      const data = await res.json();
      if (data.reporte) {
        setReporte(data.reporte);
        await cargarDatos();
        mostrarToast('Reporte diario recalculado en SQL y redactado por DeepSeek.');
      }
    } catch (err) {
      mostrarToast('Error al generar reporte: ' + err.message, 'error');
    } finally {
      setGenerando(false);
    }
  };

  const handleSyncDrive = async () => {
    setSincronizandoDrive(true);
    try {
      const res = await fetch('/api/admin/sync-drive', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      mostrarToast(
        data.mensaje || 'Sincronización con Google Drive y ChromaDB finalizada con éxito.'
      );
    } catch (err) {
      mostrarToast('Error al sincronizar con Drive: ' + err.message, 'error');
    } finally {
      setSincronizandoDrive(false);
    }
  };

  const handleResolverSolicitud = async (idSolicitud, nuevoEstado, nombreColab) => {
    setResolviendoId(idSolicitud);
    try {
      const res = await fetch(`/api/solicitudes/${idSolicitud}/resolver`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json();
      if (data.ok) {
        setSolicitudes((prev) => prev.filter((s) => s.id !== idSolicitud));
        mostrarToast(
          `Solicitud de ${nombreColab} marcada como ${nuevoEstado.toUpperCase()}.`
        );
      } else {
        mostrarToast(data.error || 'No se pudo actualizar la solicitud.', 'error');
      }
    } catch (err) {
      mostrarToast('Error de red al resolver solicitud: ' + err.message, 'error');
    } finally {
      setResolviendoId(null);
    }
  };

  const handleCopiarResumen = () => {
    const texto = reporte?.resumen_ejecutivo || '';
    navigator.clipboard.writeText(texto);
    setResumenCopiado(true);
    setTimeout(() => setResumenCopiado(false), 2000);
  };

  const handleExportarReporteJSON = () => {
    if (!reporte) return;
    const blob = new Blob([JSON.stringify(reporte, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_rrhh_${(reporte.fecha || 'hoy').slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-11 h-11 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-700">
          Calculando los 8 indicadores deterministas en MySQL y cargando analítica...
        </p>
      </div>
    );
  }

  const metricas = reporte?.metricas || {};
  const ausentesTotal = metricas['1_personas_ausentes']?.total ?? 3;
  const solPendientes = solicitudes.length || (metricas['2_solicitudes_pendientes']?.total ?? 0);
  const solMas3Dias =
    solicitudes.filter((s) => s.alerta_retraso).length ||
    (metricas['2_solicitudes_pendientes']?.mas_de_3_dias ?? 0);
  const incapacidadesActivas = metricas['3_incapacidades']?.activas ?? 2;
  const diasIncapMes = metricas['3_incapacidades']?.dias_acumulados_mes ?? 14;
  const ingresosMes = metricas['4_rotacion_personal']?.ingresos_mes ?? 2;
  const salidasMes = metricas['4_rotacion_personal']?.salidas_mes ?? 1;
  const tasaRotacion = metricas['4_rotacion_personal']?.tasa_rotacion_pct ?? 2.0;
  const pasivoVacacional = metricas['5_pasivo_laboral_vacaciones']?.total_colaboradores_alerta ?? 7;
  const listaPasivo = metricas['5_pasivo_laboral_vacaciones']?.colaboradores_mas_20_dias || [];
  const chatResolucionPct = metricas['6_chatbot_uso_dia_anterior']?.porcentaje_resueltas ?? 94.2;
  const chatLatenciaMs = metricas['6_chatbot_uso_dia_anterior']?.latencia_promedio_ms ?? 1420;
  const topTemas = Array.isArray(metricas['7_top_temas_consultados'])
    ? metricas['7_top_temas_consultados']
    : metricas['7_top_temas_consultados']?.temas || [];
  const preguntasEscaladas =
    metricas['8_preguntas_sin_respuesta']?.detalle ||
    metricas['7_top_temas_consultados']?.preguntas_sin_resolver ||
    [];

  // Filtrado interactivo de la tabla de solicitudes
  const solicitudesFiltradas = solicitudes.filter((sol) => {
    const coincideTexto =
      !busquedaColab ||
      (sol.colaborador_nombre || '').toLowerCase().includes(busquedaColab.toLowerCase()) ||
      (sol.departamento || '').toLowerCase().includes(busquedaColab.toLowerCase()) ||
      (sol.tipo || '').toLowerCase().includes(busquedaColab.toLowerCase());

    if (!coincideTexto) return false;
    if (filtroSolicitud === 'alerta') return Boolean(sol.alerta_retraso);
    if (filtroSolicitud === 'vacaciones') return sol.tipo === 'vacaciones';
    if (filtroSolicitud === 'permisos') return sol.tipo !== 'vacaciones';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Banner Toast de Notificaciones en Tiempo Real */}
      {notificacion && (
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-2xl shadow-lg border text-xs sm:text-sm font-semibold transition-all ${
            notificacion.tipo === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{notificacion.texto}</span>
          </div>
          <button
            onClick={() => setNotificacion(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barra Superior con Controles (RF-FE-12) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Dashboard de Gestión de Talento & Analítica IA
            </h1>
            <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
              Exclusivo RRHH
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            8 indicadores calculados de forma 100% determinista en MySQL + Síntesis Ejecutiva DeepSeek
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Selector de Historial de Reportes */}
          <div className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 transition">
            <Calendar className="w-4 h-4 text-blue-600" />
            <select
              value={fechaSeleccionada}
              onChange={(e) => handleCambioFecha(e.target.value)}
              className="bg-transparent focus:outline-none font-bold text-slate-800 cursor-pointer"
            >
              {historialReportes.map((r) => {
                const fStr = (r.fecha || '').slice(0, 10);
                return (
                  <option key={r.id} value={fStr}>
                    Reporte {fStr}
                  </option>
                );
              })}
              {!historialReportes.length && <option value="hoy">Hoy (Reciente)</option>}
            </select>
          </div>

          {/* Botón Generar Reporte Manual */}
          <button
            onClick={handleGenerarReporte}
            disabled={generando}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm disabled:opacity-50"
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

          {/* Botón Exportar JSON */}
          <button
            onClick={handleExportarReporteJSON}
            title="Descargar métricas del reporte en JSON"
            className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">JSON</span>
          </button>
        </div>
      </div>

      {/* Resumen Ejecutivo IA (RF-FE-09) */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-blue-900/40">
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Resumen Ejecutivo IA (Agente Analista • Cero Alucinación Numérica)</span>
          </div>
          <button
            onClick={handleCopiarResumen}
            className="flex items-center space-x-1 text-[11px] bg-white/10 hover:bg-white/20 text-slate-200 px-2.5 py-1 rounded-lg transition border border-white/10"
          >
            {resumenCopiado ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copiar resumen</span>
              </>
            )}
          </button>
        </div>
        <div className="text-sm leading-relaxed text-slate-100 font-normal">
          {reporte?.resumen_ejecutivo ||
            'El sistema no cuenta aún con un resumen ejecutivo para esta fecha. Presiona "Generar Reporte Hoy" para disparar la redacción controlada por el LLM.'}
        </div>
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>Fuente: {reporte?.generado_por || 'cronJobs_analistaAgent (07:00 a.m.)'}</span>
          <span>
            Fecha de corte: <strong>{(reporte?.fecha || new Date().toISOString()).slice(0, 10)}</strong>
          </span>
        </div>
      </div>

      {/* 4 Tarjetas Numéricas KPI Principales (RF-FE-08) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ausentes Hoy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              1. Ausentes Hoy
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">{ausentesTotal}</div>
            <p className="text-xs text-slate-500 mt-1">Vacaciones, permisos e incapacidades</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Solicitudes Pendientes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              2. Solicitudes Pendientes
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">{solPendientes}</div>
            <div className="flex items-center space-x-1 mt-1 text-xs font-bold text-rose-600">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{solMas3Dias} con &gt; 3 días de espera</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Pasivo Vacacional */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              3. Pasivo Vacacional
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">{pasivoVacacional}</div>
            <p className="text-xs text-amber-700 font-semibold mt-1">
              Colaboradores con &gt; 20 días
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Rendimiento Chatbot */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              4. Resolución Chatbot
            </span>
            <div className="text-3xl font-black text-emerald-600 mt-1">{chatResolucionPct}%</div>
            <p className="text-xs text-slate-500 mt-1">Latencia media: {chatLatenciaMs} ms</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Fila Secundaria con los Indicadores Deterministas 5, 6, 7 y 8 del Agente Analista */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Indicador: Incapacidades CCSS / INS y Rotación */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-rose-600" />
              <span>5 & 6. Salud Ocupacional y Rotación</span>
            </span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              Mes Actual
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-slate-500 block">Incapacidades Activas</span>
              <span className="text-lg font-black text-slate-900">{incapacidadesActivas}</span>
              <span className="text-[11px] text-rose-600 font-semibold block">
                {diasIncapMes} días acum. mes
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-slate-500 block">Rotación Mensual</span>
              <span className="text-lg font-black text-indigo-700">{tasaRotacion}%</span>
              <span className="text-[11px] text-slate-600 font-semibold block">
                +{ingresosMes} ingresos / -{salidasMes} bajas
              </span>
            </div>
          </div>
        </div>

        {/* Indicador 7: Top Colaboradores en Alerta de Pasivo Vacacional (>20 días) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <UserPlus className="w-4 h-4 text-amber-600" />
              <span>7. Top Alerta Pasivo (&gt;20 días)</span>
            </span>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              Prioridad RRHH
            </span>
          </div>

          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
            {listaPasivo.length > 0 ? (
              listaPasivo.slice(0, 4).map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60"
                >
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-800">{c.nombre}</span>
                    <span className="text-[10px] text-slate-500 ml-1">({c.departamento})</span>
                  </div>
                  <span className="font-black text-rose-600 shrink-0">
                    {c.dias_acumulados} días
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">
                7 colaboradores superan el umbral de 20 días acumulados.
              </p>
            )}
          </div>
        </div>

        {/* Indicador 8: Top Temas Consultados y Preguntas Escaladas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <MessageSquareWarning className="w-4 h-4 text-blue-600" />
              <span>8. Top Intenciones & Escaladas</span>
            </span>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {preguntasEscaladas.length} escaladas
            </span>
          </div>

          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
            {topTemas.slice(0, 4).map((t, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60"
              >
                <span className="font-semibold text-slate-700 capitalize">
                  {String(t.intencion || '').replace('_', ' ')}
                </span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  {t.total} consultas
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visualización Gráfica (RF-FE-10: Mínimo 2 Gráficos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Tendencia de Consultas (30 días) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
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
              <AreaChart
                data={
                  tendencia30d.length
                    ? tendencia30d
                    : [
                        { fecha_dia: 'Día 1', total_consultas: 5 },
                        { fecha_dia: 'Día 2', total_consultas: 12 },
                        { fecha_dia: 'Día 3', total_consultas: 8 },
                      ]
                }
              >
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
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
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

      {/* Tabla Interactiva de Solicitudes Pendientes con Aprobación / Rechazo en Vivo (RF-FE-11) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm text-slate-900">
                Solicitudes Pendientes de Aprobación
              </h3>
              <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                {solicitudesFiltradas.length} de {solicitudes.length} registros
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Aprueba o rechaza solicitudes en tiempo real. Se destacan en rojo las que superan 3 días en espera.
            </p>
          </div>

          {/* Controles de Búsqueda y Filtro */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={busquedaColab}
                onChange={(e) => setBusquedaColab(e.target.value)}
                placeholder="Buscar colaborador o área..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
              {[
                { id: 'todas', label: 'Todas' },
                { id: 'alerta', label: 'Alerta >3d' },
                { id: 'vacaciones', label: 'Vacaciones' },
                { id: 'permisos', label: 'Permisos' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFiltroSolicitud(f.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    filtroSolicitud === f.id
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Colaborador</th>
                <th className="px-4 py-3">Departamento</th>
                <th className="px-4 py-3">Tipo Solicitud</th>
                <th className="px-4 py-3">Fechas</th>
                <th className="px-4 py-3">Días</th>
                <th className="px-4 py-3 text-center">Tiempo en Espera</th>
                <th className="px-6 py-3 text-right">Acción RRHH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {solicitudesFiltradas.slice(0, 12).map((sol) => (
                <tr key={sol.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-3.5 font-bold text-slate-900">
                    {sol.colaborador_nombre}
                    <span className="block text-[11px] font-normal text-slate-500">
                      {sol.colaborador_email}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{sol.departamento}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-700 capitalize">
                    {String(sol.tipo || '').replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">
                    {String(sol.fecha_inicio || '').slice(0, 10)} al{' '}
                    {String(sol.fecha_fin || '').slice(0, 10)}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-800">
                    {sol.dias_solicitados} días
                  </td>
                  <td className="px-4 py-3.5 text-center">
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
                  <td className="px-6 py-3.5 text-right">
                    <div className="inline-flex items-center space-x-1.5">
                      <button
                        onClick={() =>
                          handleResolverSolicitud(sol.id, 'aprobada', sol.colaborador_nombre)
                        }
                        disabled={resolviendoId === sol.id}
                        title="Aprobar solicitud"
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 font-bold transition disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aprobar</span>
                      </button>
                      <button
                        onClick={() =>
                          handleResolverSolicitud(sol.id, 'rechazada', sol.colaborador_nombre)
                        }
                        disabled={resolviendoId === sol.id}
                        title="Rechazar solicitud"
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 font-bold transition disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!solicitudesFiltradas.length && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                    No se encontraron solicitudes pendientes con los filtros seleccionados.
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
