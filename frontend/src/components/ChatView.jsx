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
  AlertTriangle,
  FileText,
} from 'lucide-react';

const SUGERENCIAS_INICIALES = [
  '¿Cuántos días de vacaciones me quedan disponibles?',
  '¿Cómo pido un permiso con goce de salario por duelo o fallecimiento?',
  '¿Cuándo se paga el aguinaldo y cómo se calcula en Costa Rica?',
  '¿Tienen subsidio o bono para el cuidado de mascotas?',
  '¿Cuál es el salario de mi compañero Carlos Pérez?',
];

export default function ChatView({ usuario }) {
  const [mensajes, setMensajes] = useState([
    {
      id: 'bienvenida',
      emisor: 'asistente',
      texto: `¡Hola ${usuario?.nombre?.split(' ')[0] || ''}! Soy **TicoBot**, tu asistente inteligente de Recursos Humanos en TicoTech Solutions S.A. 🇨🇷\n\nPuedo responder tus dudas sobre **políticas laborales de Costa Rica**, reglamentos internos, beneficios corporativos o consultar **tus saldos y registros personales**. ¿En qué puedo ayudarte hoy?`,
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputTexto, setInputTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const [ticketEnviado, setTicketEnviado] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes, cargando]);

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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(usuario?.id || 3),
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
    } catch (err) {
      setMensajes((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          emisor: 'asistente',
          texto: 'Disculpa, ocurrió un problema al conectar con el servidor. Por favor verifica que el backend esté en ejecución.',
          fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setCargando(false);
    }
  };

  const handleEscalarTicket = async (msg) => {
    try {
      const res = await fetch('/api/chat/escalar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(usuario?.id || 3),
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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto bg-white shadow-xl rounded-none md:rounded-2xl my-0 md:my-4 overflow-hidden border border-slate-200">
      {/* Barra de estado del Asistente */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-sm">TicoBot RRHH</h2>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-400/30">
                Multiagente RAG
              </span>
            </div>
            <p className="text-xs text-slate-400">
              ChromaDB • Google Drive • DeepSeek • Código de Trabajo CR
            </p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-xs text-slate-400">Sesión activa como:</span>
          <p className="text-xs font-semibold text-white">
            {usuario?.nombre} ({usuario?.rol})
          </p>
        </div>
      </div>

      {/* Lista de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
        {mensajes.map((msg) => (
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
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600 border border-slate-200'
              }`}
            >
              {msg.emisor === 'usuario' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>

            {/* Burbuja */}
            <div
              className={`max-w-[85%] sm:max-w-xl rounded-2xl p-4 shadow-sm ${
                msg.emisor === 'usuario'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }`}
            >
              {/* Contenido del texto */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.texto}
              </div>

              {/* Citas y Fuentes de Google Drive (RF-FE-05) */}
              {msg.fuentes && msg.fuentes.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Fuentes Oficiales en Google Drive:</span>
                  </div>
                  <div className="grid gap-2">
                    {msg.fuentes.map((f, i) => (
                      <a
                        key={i}
                        href={f.url_drive}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2 rounded-lg bg-blue-50/70 hover:bg-blue-100 border border-blue-200 text-xs text-blue-800 transition group"
                      >
                        <div className="truncate pr-2">
                          <span className="font-semibold">{f.titulo}</span>
                          <span className="text-[11px] text-blue-600 block">
                            Sección: {f.seccion} • v{f.version}
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-blue-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón de Escalamiento a RRHH (RF-FE-07) */}
              {msg.escalable && (
                <div className="mt-3.5 pt-3 border-t border-slate-100">
                  {ticketEnviado[msg.id] ? (
                    <div className="flex items-center space-x-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Ticket #{ticketEnviado[msg.id]} abierto con éxito. RRHH responderá tu duda.</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEscalarTicket(msg)}
                      className="flex items-center space-x-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-2 rounded-xl transition shadow-sm"
                    >
                      <LifeBuoy className="w-4 h-4 text-amber-700" />
                      <span>Escalar caso: Crear ticket formal con Recursos Humanos</span>
                    </button>
                  )}
                </div>
              )}

              {/* Metadatos y Latencia (RNF-01) */}
              <div
                className={`flex items-center justify-between mt-2.5 pt-1 text-[10px] ${
                  msg.emisor === 'usuario' ? 'text-blue-200' : 'text-slate-400'
                }`}
              >
                <span>{msg.fecha}</span>
                {msg.latenciaMs && (
                  <span className="flex items-center space-x-1 font-mono">
                    <Clock className="w-3 h-3 inline" />
                    <span>{msg.latenciaMs} ms</span>
                    {msg.agenteUtilizado && (
                      <span className="ml-1 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-sans">
                        {msg.agenteUtilizado}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Indicador de carga */}
        {cargando && (
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white text-blue-600 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center space-x-3 text-sm text-slate-600">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></div>
              </div>
              <span className="font-medium">Analizando políticas y datos en tiempo real...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sugerencias Rápidas (RF-FE-06) */}
      {mensajes.length <= 2 && (
        <div className="px-6 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2">
          <div className="w-full flex items-center space-x-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Consultas frecuentes de demostración:</span>
          </div>
          {SUGERENCIAS_INICIALES.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleEnviar(sug)}
              className="text-xs bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 transition shadow-sm text-left"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Input de Mensajería */}
      <div className="p-4 bg-white border-t border-slate-200">
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
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-bold transition flex items-center space-x-1.5 shadow-md shadow-blue-500/20"
          >
            <span>Enviar</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
