import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  ExternalLink,
  LifeBuoy,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Download,
  Trash2,
  Briefcase,
  BookOpen,
  Calculator,
  CalendarPlus,
  Search,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  ShieldAlert,
  Award,
} from 'lucide-react';

const CATEGORIAS_SUGERENCIAS = {
  Populares: [
    '¿Cuántos días de vacaciones me quedan disponibles?',
    '¿Cuántos días de vacaciones me quedan y puedo pasarlos al año siguiente?',
    '¿Cómo pido un permiso con goce de salario por duelo o fallecimiento?',
    '¿Cuándo se paga el aguinaldo y cómo se calcula en Costa Rica?',
    '¿Tienen subsidio o bono para el cuidado de mascotas?',
    '¿Cuál es el salario de mi compañero Carlos Pérez?',
  ],
  Vacaciones: [
    '¿Cuántos días de vacaciones me quedan disponibles?',
    '¿Cuántos días de vacaciones acumulamos por cada 50 semanas trabajadas?',
    '¿Puedo fraccionar mis vacaciones o acumularlas para el próximo año?',
    '¿Cuáles son los feriados de pago obligatorio este año en Costa Rica?',
  ],
  Permisos: [
    '¿Cómo pido un permiso con goce de salario por duelo o fallecimiento?',
    '¿Cuántos días de licencia por paternidad o matrimonio otorga TicoTech?',
    '¿Cómo solicito un permiso personal o para cita médica?',
  ],
  'Planilla y Aguinaldo': [
    '¿Cuándo se paga el aguinaldo y cómo se calcula en Costa Rica?',
    '¿Cuál es el desglose de mi última colilla de pago y deducciones?',
    '¿Qué porcentaje se rebaja de cargas sociales de la CCSS?',
  ],
  Incapacidades: [
    '¿Cuál es el subsidio que paga la CCSS y TicoTech en una incapacidad?',
    '¿Cuál es el protocolo para reportar una incapacidad del INS o CCSS?',
    '¿Tengo incapacidades registradas en mi expediente?',
  ],
  Teletrabajo: [
    '¿Cuáles son las reglas de desconexión digital y horario de teletrabajo?',
    '¿Qué beneficios ofrece la Asociación Solidarista y el seguro médico?',
  ],
  'Privacidad (Ley 8968)': [
    '¿Cuál es el salario de mi compañero Carlos Pérez?',
    '¿Cuál es el salario del gerente general?',
    '¿Qué dice la Política de Protección de Datos Personales (Ley 8968)?',
  ],
};

const CATALOGO_POLITICAS_FALLBACK = [
  {
    id: 1,
    titulo: 'Documento 1 - Política de Vacaciones y Calendario de Feriados Oficiales',
    version: '2.1',
    tipo: 'PDF',
    url_drive: 'https://drive.google.com/file/d/1drv_tt_pol_01_vacaciones_2026/view',
    pregunta: '¿Qué establece el Documento 1 sobre vacaciones anuales y feriados oficiales?',
  },
  {
    id: 2,
    titulo: 'Documento 2 - Política de Permisos y Licencias Especiales',
    version: '1.4',
    tipo: 'Google Docs',
    url_drive: 'https://drive.google.com/file/d/1drv_tt_pol_02_permisos_2026/view',
    pregunta: '¿Cuáles son los permisos con goce de salario según el Documento 2?',
  },
  {
    id: 3,
    titulo: 'Documento 3 - Protocolo de Gestión de Incapacidades CCSS e INS',
    version: '2.0',
    tipo: 'Google Docs',
    url_drive: 'https://drive.google.com/file/d/1drv_tt_pol_03_incapacidades_2026/view',
    pregunta: '¿Cómo se pagan y tramitan las incapacidades CCSS e INS según el Documento 3?',
  },
  {
    id: 4,
    titulo: 'Documento 4 - Reglamento de Jornada Laboral, Asistencia y Teletrabajo',
    version: '3.0',
    tipo: 'Google Docs',
    url_drive: 'https://drive.google.com/file/d/1drv_tt_pol_04_teletrabajo_2026/view',
    pregunta: '¿Cuáles son las condiciones de teletrabajo y jornada laboral del Documento 4?',
  },
  {
    id: 5,
    titulo: 'Documento 5 - Política de Remuneración, Planilla y Aguinaldo',
    version: '1.5',
    tipo: 'Google Sheets',
    url_drive: 'https://drive.google.com/file/d/1drv_tt_pol_05_remuneracion_2026/view',
    pregunta: '¿Cuáles son las fechas de pago, deducciones y cálculo de aguinaldo del Documento 5?',
  },
  {
    id: 6,
    titulo: 'Documento 6 - Guía de Beneficios Corporativos y Asociación Solidarista',
    version: '2.2',
    tipo: 'Google Docs',
    url_drive: 'https://drive.google.com/file/d/1drv_tt_pol_06_beneficios_2026/view',
    pregunta: '¿Qué beneficios corporativos y aporte a la Asociación Solidarista incluye el Documento 6?',
  },
  {
    id: 7,
    titulo: 'Documento 7 - Manual de Onboarding, Periodo de Prueba y Salida',
    version: '1.3',
    tipo: 'Google Docs',
    url_drive: 'https://drive.google.com/file/d/1drv_tt_pol_07_onboarding_salida_2026/view',
    pregunta: '¿Cuánto dura el periodo de prueba y el preaviso según el Documento 7?',
  },
  {
    id: 8,
    titulo: 'Documento 8 - Modelo de Evaluación de Desempeño y Plan de Mejora (PIP)',
    version: '1.8',
    tipo: 'Google Docs',
    url_drive: 'https://drive.google.com/file/d/1drv_tt_pol_08_desempeno_pip_2026/view',
    pregunta: '¿Cómo funciona la evaluación de desempeño y el Plan de Mejora según el Documento 8?',
  },
  {
    id: 9,
    titulo: 'Documento 9 - Código de Conducta y Prevención del Hostigamiento (Ley 7476)',
    version: '2.4',
    tipo: 'Google Docs',
    url_drive: 'https://drive.google.com/file/d/1drv_tt_pol_09_conducta_acoso_2026/view',
    pregunta: '¿Cuál es el protocolo ante denuncias de hostigamiento según el Documento 9?',
  },
  {
    id: 10,
    titulo: 'Documento 10 - Política de Protección de Datos Personales (Ley 8968)',
    version: '2.0',
    tipo: 'Google Docs',
    url_drive: 'https://drive.google.com/file/d/1drv_tt_pol_10_privacidad_datos_2026/view',
    pregunta: '¿Cómo protege TicoTech la privacidad de salarios y expedientes bajo la Ley 8968?',
  },
];

/**
 * Sanitiza URLs para prevenir ataques XSS (ej. inyección de esquemas javascript: o data:).
 * Valida que la URL comience únicamente con http:// o https://. Si no cumple, retorna '#'.
 */
function sanitizarUrl(url) {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return '#';
}

/**
 * Renderiza texto con soporte limpio para negritas (**texto**) y saltos de línea
 */
function FormatearTextoMensaje({ texto }) {
  if (!texto) return null;
  const lineas = String(texto).split('\n');

  const renderSegmentos = (linea) => {
    const partes = linea.split(/(\*\*.*?\*\*)/g);
    return partes.map((parte, idx) => {
      if (parte.startsWith('**') && parte.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold">
            {parte.slice(2, -2)}
          </strong>
        );
      }
      return <span key={idx}>{parte}</span>;
    });
  };

  return (
    <div className="space-y-1.5">
      {lineas.map((linea, i) => {
        const trimmed = linea.trim();
        if (!trimmed) return <div key={i} className="h-1.5" />;
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          return (
            <div key={i} className="flex items-start space-x-2 pl-1">
              <span className="text-blue-500 font-bold mt-0.5">•</span>
              <span className="flex-1">{renderSegmentos(trimmed.slice(2))}</span>
            </div>
          );
        }
        return <p key={i}>{renderSegmentos(linea)}</p>;
      })}
    </div>
  );
}

export default function ChatView({ usuario }) {
  const crearMensajeBienvenida = (u) => ({
    id: 'bienvenida',
    emisor: 'asistente',
    texto: `¡Hola **${u?.nombre?.split(' ')[0] || 'colaborador'}**! Soy **TicoBot**, tu asistente multiagente de Recursos Humanos en TicoTech Solutions S.A. 🇨🇷\n\nPuedo responder tus dudas consultando los **10 documentos oficiales en Google Drive**, el **Código de Trabajo de Costa Rica** o **tu expediente personal en MySQL** (vacaciones, colillas, permisos). ¿En qué te puedo colaborar hoy?`,
    fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  const [mensajes, setMensajes] = useState([crearMensajeBienvenida(usuario)]);
  const [inputTexto, setInputTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const [ticketEnviado, setTicketEnviado] = useState({});
  const [categoriaSug, setCategoriaSug] = useState('Populares');
  const [copiadoId, setCopiadoId] = useState(null);
  const [leyendoId, setLeyendoId] = useState(null);
  const [reacciones, setReacciones] = useState({});

  // Panel lateral interactivo
  const [panelAbierto, setPanelAbierto] = useState(true);
  const [tabPanel, setTabPanel] = useState('expediente'); // 'expediente' | 'politicas' | 'calculadora'
  const [expediente, setExpediente] = useState(null);
  const [cargandoExp, setCargandoExp] = useState(false);
  const [busquedaDoc, setBusquedaDoc] = useState('');

  // Formulario de nueva solicitud rápida
  const [mostrarFormSolicitud, setMostrarFormSolicitud] = useState(false);
  const [nuevaSol, setNuevaSol] = useState({
    tipo: 'vacaciones',
    fecha_inicio: '2026-12-21',
    fecha_fin: '2026-12-24',
    dias_solicitados: 4,
    motivo: 'Descanso familiar de fin de año',
  });
  const [enviandoSol, setEnviandoSol] = useState(false);
  const [mensajeExitoSol, setMensajeExitoSol] = useState('');

  // Calculadora Laboral CR
  const [salarioBrutoCalc, setSalarioBrutoCalc] = useState(1250000);
  const [mesesAguinaldoCalc, setMesesAguinaldoCalc] = useState(12);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes, cargando]);

  // Cargar datos del expediente del usuario autenticado al iniciar o cambiar de usuario
  const cargarMiExpediente = async () => {
    if (!usuario) return;
    setCargandoExp(true);
    try {
      const res = await fetch('/api/solicitudes/mi-expediente', {
        headers: {
          'Content-Type': 'application/json',
          ...(usuario?.token
            ? { Authorization: `Bearer ${usuario.token}` }
            : { 'x-user-id': String(usuario?.id || 3) }),
        },
      });
      const data = await res.json();
      if (data.ok) {
        setExpediente(data);
      }
    } catch (err) {
      console.error('Error cargando expediente personal:', err);
    } finally {
      setCargandoExp(false);
    }
  };

  useEffect(() => {
    cargarMiExpediente();
  }, [usuario?.id, usuario?.token]);

  const handleEnviar = async (textoAEnviar = null) => {
    const texto = (textoAEnviar || inputTexto).trim();
    if (!texto || cargando) return;

    const userMessageId = `user_${Date.now()}`;
    const nuevoMensajeUsuario = {
      id: userMessageId,
      emisor: 'usuario',
      texto,
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMensajes((prev) => [...prev, nuevoMensajeUsuario]);
    if (!textoAEnviar) setInputTexto('');
    setCargando(true);

    try {
      const csrfToken = sessionStorage.getItem('csrfToken') || usuario?.csrfToken || '';
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
          ...(usuario?.token
            ? { Authorization: `Bearer ${usuario.token}` }
            : { 'x-user-id': String(usuario?.id || 3) }),
        },
        body: JSON.stringify({ message: texto }),
      });

      const data = await response.json();

      const assistantMessageId = `bot_${Date.now()}`;
      const nuevoMensajeBot = {
        id: assistantMessageId,
        emisor: 'asistente',
        texto: data.respuesta || 'No se obtuvo respuesta del orquestador.',
        fuentes: data.fuentes || [],
        escalable: Boolean(data.escalable),
        consultaId: data.consulta_id,
        agenteUtilizado: data.agente_utilizado,
        latenciaMs: data.latencia_ms,
        intencion: data.intencion,
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMensajes((prev) => [...prev, nuevoMensajeBot]);
    } catch {
      setMensajes((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          emisor: 'asistente',
          texto:
            'Disculpa, ocurrió un problema al conectar con el servidor. Por favor verifica que el backend esté en ejecución.',
          fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setCargando(false);
    }
  };

  const handleEscalarTicket = async (msg) => {
    try {
      const csrfToken = sessionStorage.getItem('csrfToken') || usuario?.csrfToken || '';
      const res = await fetch('/api/chat/escalar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
          ...(usuario?.token
            ? { Authorization: `Bearer ${usuario.token}` }
            : { 'x-user-id': String(usuario?.id || 3) }),
        },
        body: JSON.stringify({
          consultaId: msg.consultaId,
          asunto: `Escalamiento Chatbot: ${msg.texto?.slice(0, 100)}...`,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTicketEnviado((prev) => ({ ...prev, [msg.id]: data.ticket_id }));
      }
    } catch (err) {
      alert('Error al escalar ticket: ' + err.message);
    }
  };

  const handleCopiarTexto = (msg) => {
    navigator.clipboard.writeText(msg.texto || '');
    setCopiadoId(msg.id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const handleHablarTexto = (msg) => {
    if (!('speechSynthesis' in window)) return;
    if (leyendoId === msg.id) {
      window.speechSynthesis.cancel();
      setLeyendoId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const textoLimpio = (msg.texto || '').replace(/\*\*/g, '');
    const utterance = new SpeechSynthesisUtterance(textoLimpio);
    utterance.lang = 'es-CR';
    utterance.rate = 1.03;
    utterance.onend = () => setLeyendoId(null);
    utterance.onerror = () => setLeyendoId(null);
    setLeyendoId(msg.id);
    window.speechSynthesis.speak(utterance);
  };

  const handleExportarChat = () => {
    const contenido = mensajes
      .map((m) => {
        const autor = m.emisor === 'usuario' ? usuario?.nombre || 'Colaborador' : 'TicoBot RRHH';
        const citas =
          m.fuentes && m.fuentes.length
            ? '\n  Fuentes Drive: ' + m.fuentes.map((f) => `${f.titulo} (${f.url_drive})`).join(', ')
            : '';
        return `[${m.fecha}] ${autor}:\n${m.texto}${citas}\n`;
      })
      .join('\n----------------------------------------\n');

    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial_ticobot_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLimpiarChat = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setLeyendoId(null);
    setMensajes([crearMensajeBienvenida(usuario)]);
  };

  const handleCrearSolicitud = async (e) => {
    e.preventDefault();
    setEnviandoSol(true);
    setMensajeExitoSol('');
    try {
      const csrfToken = sessionStorage.getItem('csrfToken') || usuario?.csrfToken || '';
      const res = await fetch('/api/solicitudes/crear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
          ...(usuario?.token
            ? { Authorization: `Bearer ${usuario.token}` }
            : { 'x-user-id': String(usuario?.id || 3) }),
        },
        body: JSON.stringify(nuevaSol),
      });
      const data = await res.json();
      if (data.ok) {
        setMensajeExitoSol(`Solicitud #${data.id} registrada exitosamente.`);
        setMostrarFormSolicitud(false);
        await cargarMiExpediente();
        setTimeout(() => setMensajeExitoSol(''), 4000);
      }
    } catch (err) {
      console.error('Error creando solicitud:', err);
    } finally {
      setEnviandoSol(false);
    }
  };

  // Cálculos de la Calculadora Laboral de Costa Rica (CCSS 10.67% + Renta Progresiva CR)
  const salarioNum = Number(salarioBrutoCalc) || 0;
  const deduccionCCSS = Math.round(salarioNum * 0.1067);
  const calcularRentaCR = (bruto) => {
    // Tramos aproximados impuesto al salario CR
    if (bruto <= 929000) return 0;
    let impuesto = 0;
    if (bruto > 929000) {
      const tramo1 = Math.min(bruto, 1363000) - 929000;
      impuesto += tramo1 * 0.1;
    }
    if (bruto > 1363000) {
      const tramo2 = Math.min(bruto, 2392000) - 1363000;
      impuesto += tramo2 * 0.15;
    }
    if (bruto > 2392000) {
      const tramo3 = bruto - 2392000;
      impuesto += tramo3 * 0.2;
    }
    return Math.round(impuesto);
  };
  const deduccionRenta = calcularRentaCR(salarioNum);
  const aporteSolidarista = Math.round(salarioNum * 0.05);
  const salarioNetoEst = Math.max(0, salarioNum - deduccionCCSS - deduccionRenta - aporteSolidarista);
  const aguinaldoEst = Math.round((salarioNum * (Number(mesesAguinaldoCalc) || 12)) / 12);

  // Lista de políticas combinando BD y metadatos de respaldo
  const listaPoliticas = CATALOGO_POLITICAS_FALLBACK.filter((doc) =>
    doc.titulo.toLowerCase().includes(busquedaDoc.toLowerCase())
  );

  const badgeAgente = (agente) => {
    if (agente === 'politicasAgent') {
      return { texto: 'Agente Políticas RAG', clase: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
    if (agente === 'datosAgent') {
      return { texto: 'Agente Datos SQL', clase: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    return { texto: 'Orquestador Multiagente', clase: 'bg-amber-50 text-amber-800 border-amber-200' };
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 md:py-5">
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-5.8rem)]">
        {/* COLUMNA PRINCIPAL: VENTANA DE CHAT */}
        <div className="flex-1 flex flex-col bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200/90 min-w-0">
          {/* Barra de estado del Asistente */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
                  <Bot className="w-6 h-6" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="font-bold text-sm tracking-tight">TicoBot RRHH</h2>
                  <span className="text-[10px] bg-blue-500/20 text-blue-200 font-semibold px-2 py-0.5 rounded-full border border-blue-400/30">
                    Multiagente RAG
                  </span>
                </div>
                <p className="text-[11px] text-slate-300/80 hidden sm:block">
                  ChromaDB • Google Drive API • DeepSeek • Ley 8968 CR
                </p>
              </div>
            </div>

            {/* Botones de Acción Rápida en Cabecera del Chat */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleExportarChat}
                title="Descargar transcripción de la conversación"
                className="flex items-center space-x-1 text-xs bg-white/10 hover:bg-white/20 text-slate-200 px-2.5 py-1.5 rounded-lg transition border border-white/10"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Exportar</span>
              </button>

              <button
                onClick={handleLimpiarChat}
                title="Reiniciar conversación"
                className="flex items-center space-x-1 text-xs bg-white/10 hover:bg-rose-500/30 text-slate-200 hover:text-rose-200 px-2.5 py-1.5 rounded-lg transition border border-white/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Limpiar</span>
              </button>

              <button
                onClick={() => setPanelAbierto(!panelAbierto)}
                title={panelAbierto ? 'Ocultar panel lateral' : 'Mostrar Mi Expediente y Herramientas'}
                className={`flex items-center space-x-1 text-xs px-2.5 py-1.5 rounded-lg transition border font-semibold ${
                  panelAbierto
                    ? 'bg-blue-600 text-white border-blue-400'
                    : 'bg-white/10 text-slate-200 border-white/10 hover:bg-white/20'
                }`}
              >
                {panelAbierto ? (
                  <PanelRightClose className="w-3.5 h-3.5" />
                ) : (
                  <PanelRightOpen className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Herramientas</span>
              </button>
            </div>
          </div>

          {/* Lista de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-chat-pattern">
            {mensajes.map((msg) => {
              const infoAgente = badgeAgente(msg.agenteUtilizado);
              const esRestringida = msg.intencion === 'privacidad_rechazada';

              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3 ${
                    msg.emisor === 'usuario' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      msg.emisor === 'usuario'
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
                        : esRestringida
                        ? 'bg-rose-100 text-rose-600 border border-rose-300'
                        : 'bg-white text-blue-600 border border-slate-200'
                    }`}
                  >
                    {msg.emisor === 'usuario' ? (
                      <User className="w-5 h-5" />
                    ) : esRestringida ? (
                      <ShieldAlert className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </div>

                  {/* Burbuja */}
                  <div
                    className={`max-w-[88%] sm:max-w-2xl rounded-2xl p-4 shadow-sm transition-all ${
                      msg.emisor === 'usuario'
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-none'
                        : esRestringida
                        ? 'bg-rose-50/95 text-slate-900 border-2 border-rose-200 rounded-tl-none'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                    }`}
                  >
                    {/* Contenido del texto con formato enriquecido */}
                    <div className="text-sm leading-relaxed">
                      <FormatearTextoMensaje texto={msg.texto} />
                    </div>

                    {/* Citas y Fuentes de Google Drive (RF-FE-05) */}
                    {msg.fuentes && msg.fuentes.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Fuentes Oficiales Verificadas en Google Drive:</span>
                        </div>
                        <div className="grid gap-2">
                          {msg.fuentes.map((f, i) => (
                            <a
                              key={i}
                              href={sanitizarUrl(f.url_drive)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-blue-50/90 to-indigo-50/60 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/80 text-xs text-blue-900 transition group shadow-2xs"
                            >
                              <div className="truncate pr-2">
                                <span className="font-bold text-blue-800 group-hover:underline">
                                  {f.titulo}
                                </span>
                                <span className="text-[11px] text-blue-600/90 block mt-0.5">
                                  Sección: {f.seccion} • Versión {f.version}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 text-[11px] font-semibold text-blue-700 bg-white px-2 py-1 rounded-lg border border-blue-200 shrink-0">
                                <span>Abrir Drive</span>
                                <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Botón de Escalamiento a RRHH (RF-FE-07) */}
                    {msg.escalable && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100">
                        {ticketEnviado[msg.id] ? (
                          <div className="flex items-center space-x-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-xl font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              Ticket <strong>#{ticketEnviado[msg.id]}</strong> registrado en MySQL. Un especialista de RRHH atenderá tu caso.
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEscalarTicket(msg)}
                            className="flex items-center space-x-2 text-xs font-bold text-amber-900 bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 border border-amber-300 px-3.5 py-2.5 rounded-xl transition shadow-xs"
                          >
                            <LifeBuoy className="w-4 h-4 text-amber-700" />
                            <span>Escalar caso: Crear ticket formal con Recursos Humanos</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Barra Inferior de Metadatos, Latencia y Acciones Interactivas */}
                    <div
                      className={`flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t text-[10px] ${
                        msg.emisor === 'usuario'
                          ? 'border-blue-500/40 text-blue-100'
                          : 'border-slate-100 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{msg.fecha}</span>
                        {msg.latenciaMs && (
                          <span className="flex items-center space-x-1 font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            <Clock className="w-2.5 h-2.5 inline" />
                            <span>{msg.latenciaMs} ms</span>
                          </span>
                        )}
                        {msg.agenteUtilizado && (
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold border ${infoAgente.clase}`}
                          >
                            {infoAgente.texto}
                          </span>
                        )}
                      </div>

                      {/* Acciones de mensaje del asistente: Copiar, Escuchar (TTS), Feedback */}
                      {msg.emisor === 'asistente' && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleCopiarTexto(msg)}
                            title="Copiar respuesta"
                            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition"
                          >
                            {copiadoId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleHablarTexto(msg)}
                            title={leyendoId === msg.id ? 'Detener lectura' : 'Escuchar respuesta en voz alta'}
                            className={`p-1 rounded transition ${
                              leyendoId === msg.id
                                ? 'bg-blue-100 text-blue-700'
                                : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                            }`}
                          >
                            {leyendoId === msg.id ? (
                              <VolumeX className="w-3.5 h-3.5" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() =>
                              setReacciones((prev) => ({
                                ...prev,
                                [msg.id]: prev[msg.id] === 'up' ? null : 'up',
                              }))
                            }
                            title="Respuesta útil"
                            className={`p-1 rounded transition ${
                              reacciones[msg.id] === 'up'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() =>
                              setReacciones((prev) => ({
                                ...prev,
                                [msg.id]: prev[msg.id] === 'down' ? null : 'down',
                              }))
                            }
                            title="Respuesta mejorable"
                            className={`p-1 rounded transition ${
                              reacciones[msg.id] === 'down'
                                ? 'bg-rose-100 text-rose-700'
                                : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                            }`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Indicador de carga */}
            {cargando && (
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-xl bg-white text-blue-600 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center space-x-3 text-xs sm:text-sm text-slate-600">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  <span className="font-medium">
                    Orquestando agentes (ChromaDB + MySQL + DeepSeek)...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Explorador Categorizado de Consultas Frecuentes (RF-FE-06 Mejorado) */}
          <div className="px-4 py-2.5 bg-slate-50/90 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2 overflow-x-auto pb-1 gap-1.5">
              <div className="flex items-center space-x-1 shrink-0 mr-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Temas:
                </span>
              </div>
              <div className="flex items-center space-x-1">
                {Object.keys(CATEGORIAS_SUGERENCIAS).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaSug(cat)}
                    className={`text-[11px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap transition ${
                      categoriaSug === cat
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {(CATEGORIAS_SUGERENCIAS[categoriaSug] || []).map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleEnviar(sug)}
                  disabled={cargando}
                  className="text-xs bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200/90 rounded-xl px-3 py-1.5 text-slate-700 transition shadow-2xs whitespace-nowrap shrink-0"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Input de Mensajería */}
          <div className="p-3.5 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEnviar();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={inputTexto}
                onChange={(e) => setInputTexto(e.target.value)}
                placeholder="Pregúntale a TicoBot sobre tus vacaciones, feriados, aguinaldo o normativas..."
                disabled={cargando}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={!inputTexto.trim() || cargando}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-bold transition flex items-center space-x-1.5 shadow-md shadow-blue-500/20"
              >
                <span>Enviar</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* COLUMNA LATERAL INTERACTIVA: MI EXPEDIENTE, BIBLIOTECA DRIVE Y CALCULADORA CR */}
        {panelAbierto && (
          <div className="w-full lg:w-96 flex flex-col bg-white shadow-xl rounded-2xl border border-slate-200/90 overflow-hidden shrink-0">
            {/* Selector de Pestañas del Panel Lateral */}
            <div className="grid grid-cols-3 bg-slate-100 p-1.5 border-b border-slate-200 text-xs font-bold">
              <button
                onClick={() => setTabPanel('expediente')}
                className={`flex items-center justify-center space-x-1 py-2 rounded-xl transition ${
                  tabPanel === 'expediente'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Mi Portal</span>
              </button>

              <button
                onClick={() => setTabPanel('politicas')}
                className={`flex items-center justify-center space-x-1 py-2 rounded-xl transition ${
                  tabPanel === 'politicas'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Drive (10)</span>
              </button>

              <button
                onClick={() => setTabPanel('calculadora')}
                className={`flex items-center justify-center space-x-1 py-2 rounded-xl transition ${
                  tabPanel === 'calculadora'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Cálculo CR</span>
              </button>
            </div>

            {/* Contenido del Panel Lateral */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* TAB 1: MI EXPEDIENTE Y SOLICITUD RÁPIDA */}
              {tabPanel === 'expediente' && (
                <>
                  {/* Tarjeta de Saldo de Vacaciones en Vivo */}
                  <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white p-4 rounded-2xl shadow-md relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-blue-200 font-bold">
                          Saldo de Vacaciones
                        </span>
                        <div className="text-3xl font-black mt-0.5">
                          {cargandoExp
                            ? '...'
                            : `${expediente?.total_vacaciones_disponibles ?? 14} días`}
                        </div>
                        <p className="text-[11px] text-blue-100 mt-0.5">
                          Disponibles para disfrute inmediato
                        </p>
                      </div>
                      <button
                        onClick={() => setMostrarFormSolicitud(!mostrarFormSolicitud)}
                        className="bg-white text-blue-800 hover:bg-blue-50 text-xs font-bold px-3 py-2 rounded-xl shadow flex items-center space-x-1 transition"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        <span>Solicitar</span>
                      </button>
                    </div>
                  </div>

                  {mensajeExitoSol && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3 rounded-xl flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{mensajeExitoSol}</span>
                    </div>
                  )}

                  {/* Formulario Rápido para Crear Solicitud de Vacaciones / Permiso */}
                  {mostrarFormSolicitud && (
                    <form
                      onSubmit={handleCrearSolicitud}
                      className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900">
                          Nueva Solicitud a Recursos Humanos
                        </span>
                        <button
                          type="button"
                          onClick={() => setMostrarFormSolicitud(false)}
                          className="text-slate-400 hover:text-slate-600 font-bold"
                        >
                          ✕
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Tipo de Licencia o Permiso
                        </label>
                        <select
                          value={nuevaSol.tipo}
                          onChange={(e) => setNuevaSol({ ...nuevaSol, tipo: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="vacaciones">Vacaciones Anuales</option>
                          <option value="permiso_personal">Permiso Personal</option>
                          <option value="permiso_fallecimiento">Permiso por Duelo / Fallecimiento</option>
                          <option value="permiso_paternidad">Licencia de Paternidad</option>
                          <option value="permiso_matrimonio">Permiso por Matrimonio</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Fecha Inicio
                          </label>
                          <input
                            type="date"
                            value={nuevaSol.fecha_inicio}
                            onChange={(e) =>
                              setNuevaSol({ ...nuevaSol, fecha_inicio: e.target.value })
                            }
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Fecha Fin
                          </label>
                          <input
                            type="date"
                            value={nuevaSol.fecha_fin}
                            onChange={(e) =>
                              setNuevaSol({ ...nuevaSol, fecha_fin: e.target.value })
                            }
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Días
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={nuevaSol.dias_solicitados}
                            onChange={(e) =>
                              setNuevaSol({ ...nuevaSol, dias_solicitados: e.target.value })
                            }
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Motivo
                          </label>
                          <input
                            type="text"
                            value={nuevaSol.motivo}
                            onChange={(e) => setNuevaSol({ ...nuevaSol, motivo: e.target.value })}
                            placeholder="Justificación breve"
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={enviandoSol}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl transition shadow-xs"
                      >
                        {enviandoSol ? 'Registrando en MySQL...' : 'Enviar Solicitud Oficial'}
                      </button>
                    </form>
                  )}

                  {/* Mis Solicitudes Recientes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                        Mis Solicitudes Recientes
                      </h4>
                      <button
                        onClick={() => handleEnviar('¿Cuál es el estado de mis solicitudes de vacaciones y permisos?')}
                        className="text-[11px] text-blue-600 hover:underline font-semibold"
                      >
                        Consultar en chat
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(expediente?.solicitudes || []).slice(0, 4).map((s) => (
                        <div
                          key={s.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800 capitalize">
                              {String(s.tipo || '').replace('_', ' ')}
                            </span>
                            <span className="block text-[11px] text-slate-500">
                              {String(s.fecha_inicio || '').slice(0, 10)} • {s.dias_solicitados} días
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              s.estado === 'aprobada'
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : s.estado === 'rechazada'
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {s.estado}
                          </span>
                        </div>
                      ))}
                      {(!expediente?.solicitudes || expediente.solicitudes.length === 0) && (
                        <p className="text-xs text-slate-400 italic">
                          No tienes solicitudes registradas aún.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Beneficios Activos del Colaborador */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-1">
                        <Award className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Mis Beneficios Activos</span>
                      </h4>
                      <button
                        onClick={() => handleEnviar('¿Cuáles beneficios corporativos tengo activos actualmente?')}
                        className="text-[11px] text-blue-600 hover:underline font-semibold"
                      >
                        Ver detalle
                      </button>
                    </div>
                    <div className="grid gap-1.5">
                      {(expediente?.beneficios || []).map((b, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between text-xs"
                        >
                          <div className="truncate pr-2">
                            <span className="font-semibold text-slate-800">{b.nombre}</span>
                            <span className="block text-[10px] text-slate-500">{b.proveedor}</span>
                          </div>
                          <span className="text-[10px] font-bold bg-white text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200 shrink-0">
                            Cubierto {b.aporte_empresa_pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: BIBLIOTECA INTERACTIVA DE 10 POLÍTICAS EN GOOGLE DRIVE */}
              {tabPanel === 'politicas' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={busquedaDoc}
                      onChange={(e) => setBusquedaDoc(e.target.value)}
                      placeholder="Buscar documento o normativa..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    {listaPoliticas.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200/90 transition space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800 leading-snug">
                            {doc.titulo}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 shrink-0">
                            v{doc.version}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <a
                            href={sanitizarUrl(doc.url_drive)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 text-[11px] font-semibold text-blue-600 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Ver en Drive ({doc.tipo})</span>
                          </a>

                          <button
                            onClick={() => handleEnviar(doc.pregunta)}
                            disabled={cargando}
                            className="inline-flex items-center space-x-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg transition shadow-2xs"
                          >
                            <span>Preguntar</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: CALCULADORA LABORAL COSTA RICA */}
              {tabPanel === 'calculadora' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 p-3 rounded-xl">
                    <h4 className="font-bold text-indigo-950 text-xs">
                      Simulador Salarial & Aguinaldo CR 🇨🇷
                    </h4>
                    <p className="text-[11px] text-indigo-700 mt-0.5">
                      Calcula cargas sociales CCSS (10.67%), Impuesto de Renta y Aguinaldo según ley costarricense.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Salario Bruto Mensual (₡ Colones)
                      </label>
                      <input
                        type="number"
                        step="25000"
                        min="300000"
                        value={salarioBrutoCalc}
                        onChange={(e) => setSalarioBrutoCalc(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Meses trabajados en el año ({mesesAguinaldoCalc} meses)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={mesesAguinaldoCalc}
                        onChange={(e) => setMesesAguinaldoCalc(e.target.value)}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Deducción CCSS Obrera (10.67%):</span>
                      <span className="font-semibold text-rose-600">
                        - ₡{deduccionCCSS.toLocaleString('es-CR')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Impuesto al Salario (Renta CR):</span>
                      <span className="font-semibold text-rose-600">
                        - ₡{deduccionRenta.toLocaleString('es-CR')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Ahorro Asociación Solidarista (5%):</span>
                      <span className="font-semibold text-indigo-600">
                        - ₡{aporteSolidarista.toLocaleString('es-CR')}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="font-bold text-slate-800">Salario Neto Mensual:</span>
                      <span className="text-sm font-black text-emerald-700">
                        ₡{salarioNetoEst.toLocaleString('es-CR')}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="font-bold text-blue-900">Aguinaldo Estimado (Exento):</span>
                      <span className="text-sm font-black text-blue-700">
                        ₡{aguinaldoEst.toLocaleString('es-CR')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleEnviar(
                        '¿Cómo se calculan las deducciones de CCSS, Asociación Solidarista y el Aguinaldo según el Documento 5?'
                      )
                    }
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition shadow-xs"
                  >
                    Verificar base legal con TicoBot
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
