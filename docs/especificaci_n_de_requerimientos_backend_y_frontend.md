# Especificación de Requerimientos del Sistema — TicoTech HR Portal

**Proyecto:** Portal de Consulta de Políticas de RRHH con RAG Multiagente

**Empresa Ficticia:** TicoTech Solutions S.A. (Costa Rica)

**Stack Tecnológico:** React + Vite (Frontend) | Node.js + Express + mysql2 (Backend) | MySQL 8+ & ChromaDB (Almacenamiento) | DeepSeek API & Google Drive API

## 1. Requerimientos del Backend (API, Agentes e Integraciones)

### 1.1. Gestión de Datos y Almacenamiento

* **RF-BE-01 (Base de Datos Relacional):** El backend debe conectarse a MySQL (`rrhh_ticotech`) mediante pool de conexiones nativo (`mysql2/promise`), gestionando las entidades de colaboradores, saldos de vacaciones, solicitudes, incapacidades, movimientos de personal, logs de chat y reportes diarios.

* **RF-BE-02 (Base Vectorial):** Debe mantener una instancia de ChromaDB sincronizada exclusivamente con los fragmentos (*chunks* de 500–1000 tokens con solapamiento) de los documentos de políticas provenientes de Google Drive.

* **RF-BE-03 (Metadatos Obligatorios):** Cada fragmento vectorizado debe almacenar obligatoriamente en sus metadatos: `titulo_documento`, `seccion`, `version`, `fecha_vigencia` y `url_drive`.

### 1.2. Agente de Ingesta y Sincronización (`ingestaAgent`)

* **RF-BE-04 (Conexión a Google Drive):** Debe autenticarse mediante Cuenta de Servicio de Google Cloud Console (permisos de solo lectura) hacia la carpeta compartida `Politicas_RRHH_TicoTech`.

* **RF-BE-05 (Soporte Multi-formato):** El extractor debe procesar sin errores archivos en formato **PDF** (`pdf-parse`), **Google Docs** y **Google Sheets** (exportados vía Drive API).

* **RF-BE-06 (Sincronización Incremental):** Debe utilizar el endpoint `changes.list` de la Drive API (ejecutado vía cron diario y mediante un endpoint administrativo manual `POST /api/admin/sync-drive`) para detectar archivos nuevos, modificados o eliminados y actualizar ChromaDB automáticamente.

### 1.3. Arquitectura Multiagente Conversacional

* **RF-BE-07 (Prompts Desacoplados):** Las instrucciones de sistema (*system prompts*) de cada agente deben residir en archivos `.txt` o `.md` independientes dentro de `src/prompts/` para su versionamiento en Git.

* **RF-BE-08 (Agente Orquestador - `orquestador`):**

  * Debe recibir la consulta en lenguaje natural, el historial de sesión y el objeto del usuario autenticado (`id`, `rol`, `departamento`).

  * Debe clasificar la intención en: `POLITICA`, `DATO_PERSONAL`, `MIXTA`, `DATO_AGREGADO_RRHH`, `RESTRINGIDA_PRIVACIDAD` o `FUERA_DE_ALCANCE`.

  * En consultas `MIXTA` (ej. *"¿Cuántos días me quedan y puedo pasarlos al otro año?"*), debe invocar en paralelo al Agente de Datos y al Agente de Políticas y sintetizar una única respuesta coherente.

  * Debe bloquear inmediatamente consultas sobre terceros (ej. salario o vacaciones de un compañero) y redirigir temas ajenos a RRHH.

* **RF-BE-09 (Agente de Políticas - `politicasAgent`):**

  * Debe consultar únicamente ChromaDB (nunca MySQL).

  * Toda respuesta afirmativa debe incluir al menos una cita explícita con el nombre del documento y su enlace directo a Google Drive.

  * Si la similitud semántica está por debajo del umbral definido (ej. `< 0.65`), debe indicar explícitamente que la política no se encuentra en los documentos oficiales y ofrecer escalar el caso a RRHH.

* **RF-BE-10 (Agente de Datos - `datosAgent`):**

  * Debe ejecutar consultas SQL de **estricto solo lectura** (`SELECT`), inyectando obligatoriamente `WHERE colaborador_id = :authenticated_user_id` desde el token/sesión del backend (nunca desde el prompt del usuario).

  * Si el usuario tiene rol `rrhh`, puede ejecutar consultas agregadas de equipo (ej. *"¿Cuántas personas están de vacaciones hoy?"*).

* **RF-BE-11 (Auditoría de Consultas):** Cada interacción debe registrarse en la tabla `consultas_chat` guardando: `colaborador_id`, `pregunta`, `intencion`, `agente_utilizado`, `documentos_citados` (JSON), `resuelta`, `escalada` y `latencia_ms`.

### 1.4. Agente Analista y Reportes Diarios (`analistaAgent`)

* **RF-BE-12 (Ejecución Programada):** Mediante `node-cron`, debe ejecutarse todos los días a las **07:00 a.m.** (y contar con un endpoint `POST /api/reportes/generar` para demostraciones en vivo).

* **RF-BE-13 (Cálculo Determinista en SQL):** Las cifras deben calcularse 100% mediante consultas SQL de agregación e incluir como mínimo:

  1. Personas ausentes hoy (desglosadas por vacaciones, permiso, incapacidad y por departamento).

  2. Solicitudes pendientes de aprobación y cuántas llevan más de 3 días sin respuesta.

  3. Incapacidades activas y días acumulados en el mes actual.

  4. Ingresos y salidas del mes, más la tasa de rotación acumulada.

  5. Colaboradores con más de 20 días de vacaciones acumulados (alerta de pasivo laboral).

  6. Uso del chatbot del día anterior (total consultas, % resuelto sin escalar, latencia promedio).

  7. Top 5 de temas más consultados y listado de preguntas sin respuesta en el RAG.

* **RF-BE-14 (Redacción Controlada por LLM):** El LLM recibirá el JSON calculado por SQL y redactará un resumen ejecutivo de **3 a 5 frases**, bajo la restricción estricta de no alterar ni inventar ningún valor numérico. El resultado se guarda en `reportes_diarios`.

### 1.5. Endpoints API REST Mínimos

* `POST /api/auth/login` — Autenticación de colaborador o usuario RRHH (retorna JWT o sesión con `id` y `rol`).

* `POST /api/chat` — Recepción de mensajes para el Orquestador (retorna respuesta, citas, agente usado y latencia).

* `GET /api/chat/historial` — Historial de conversación del usuario autenticado.

* `GET /api/reportes/ultimo` — Obtiene el reporte diario más reciente (Middleware: solo `rol === 'rrhh'`).

* `GET /api/reportes/historial` — Lista reportes de fechas anteriores y datos para gráfico de tendencia de 30 días (Middleware: solo `rol === 'rrhh'`).

* `GET /api/solicitudes/pendientes` — Lista solicitudes sin aprobar para la tabla del dashboard (Middleware: solo `rol === 'rrhh'`).

* `POST /api/admin/sync-drive` — Fuerza la sincronización manual con Google Drive (Middleware: solo `rol === 'rrhh'`).

## 2. Requerimientos del Frontend (Interfaz Web React + Vite)

### 2.1. Autenticación y Control de Acceso por Roles

* **RF-FE-01 (Pantalla de Inicio de Sesión):** Formulario de acceso (o selector rápido de perfiles de prueba para la demo) que permita autenticarse con al menos dos roles diferenciados: **Colaborador** (ej. *Carlos Pérez*) y **RRHH** (ej. *Ana Gómez*).

* **RF-FE-02 (Protección de Rutas):** Un usuario con rol `colaborador` solo debe visualizar la vista del Chat y su perfil básico. Las rutas y pestañas del Dashboard de RRHH deben estar ocultas en la navegación y bloqueadas en el enrutador (`ProtectedRoute`) si el rol no es `rrhh`.

* **RF-FE-03 (Cabecera de Contexto):** Mostrar claramente el nombre del colaborador logueado, su departamento, su rol activo y un botón para cerrar sesión.

### 2.2. Módulo de Chat Conversacional (`TicoBot RRHH`)

* **RF-FE-04 (Interfaz de Mensajería):** Área de chat fluida con distinción visual entre mensajes del usuario y respuestas del asistente, indicador de carga ("Analizando políticas y datos...") y auto-scroll al último mensaje.

* **RF-FE-05 (Renderizado de Citas y Enlaces):** Cuando la respuesta incluya fuentes documentales, debe mostrar tarjetas o badges clicables con el **nombre del documento** y un enlace (`target="_blank"`) que abra el archivo directamente en Google Drive.

* **RF-FE-06 (Sugerencias Rápidas / Prompts de Inicio):** Botones de consulta rápida en pantalla vacía (ej. *"¿Cuántos días de vacaciones me quedan?"*, *"¿Cómo pido un permiso por duelo?"*, *"¿Cuándo pagan el aguinaldo?"*) para facilitar la interacción.

* **RF-FE-07 (Flujo de Escalamiento):** Si el agente indica que no encontró información en los documentos, mostrar un botón de acción para crear un ticket/escalar la duda al equipo de RRHH.

### 2.3. Módulo de Dashboard Interno (Exclusivo Rol `RRHH`)

* **RF-FE-08 (Tarjetas de Indicadores KPI):** Mostrar al menos **4 tarjetas numéricas** destacadas del reporte del día:

  1. Ausentes hoy (Vacaciones / Incapacidades).

  2. Solicitudes pendientes (resaltando en alerta las de `> 3 días`).

  3. Colaboradores con riesgo de pasivo vacacional (`> 20 días`).

  4. Tasa de resolución del Chatbot (`% resueltas sin escalar` y latencia promedio).

* **RF-FE-09 (Resumen Ejecutivo IA):** Bloque destacado en la parte superior del dashboard que muestre el resumen ejecutivo de 3 a 5 frases generado por el Agente Analista.

* **RF-FE-10 (Visualización Gráfica - Mínimo 2 Gráficos):**

  1. **Gráfico de Tendencia (30 días):** Gráfico de líneas o áreas (usando Recharts o Chart.js) mostrando la evolución de consultas al chatbot o ausencias durante los últimos 30 días.

  2. **Gráfico Categórico:** Gráfico de barras o dona mostrando el **Top 5 de temas más consultados** o la distribución de ausencias por departamento.

* **RF-FE-11 (Tabla de Solicitudes Pendientes):** Tabla interactiva con columnas de Colaborador, Departamento, Tipo de Solicitud, Fechas y Días en espera (marcando visualmente las que superan 3 días).

* **RF-FE-12 (Selector de Historial y Botón de Actualización):** Un selector de fecha (`date picker` o lista desplegable) para consultar reportes diarios anteriores almacenados en `reportes_diarios`, junto con un botón para disparar la generación manual del reporte del día durante pruebas.

## 3. Requerimientos No Funcionales (Obligatorios para Evaluación)

1. **RNF-01 (Latencia / Rendimiento):** El 90% de las consultas al chatbot deben completarse y renderizarse en el frontend en **menos de 8 segundos**.

2. **RNF-02 (Seguridad de Datos y Privacidad):** Cero tolerancia a fugas de información personal de terceros. El frontend nunca debe enviar el `colaborador_id` como parámetro manipulable en el cuerpo de la pregunta SQL; debe viajar firmado en el token de sesión.

3. **RNF-03 (Gestión de Secretos):** Ninguna API Key (`GEMINI_API_KEY`), credencial de Google Cloud (`credentials.json`) o contraseña de MySQL puede estar versionada en el repositorio. Debe existir un `.env.example` documentado.

4. **RNF-04 (Trazabilidad y Cero Alucinaciones):** El sistema nunca debe inventar cifras en el reporte diario ni políticas inexistentes en el chat.

## 4. Checklist de Control y Cumplimiento (QA del Proyecto)

Utiliza esta lista de verificación antes de cada revisión semanal y de la entrega final para asegurar el **100% de la rúbrica**:

### Fase 1: Investigación y Documentación en Drive (15 pts)

* [x] Informe de investigación redactado (6 a 10 páginas) citando el Código de Trabajo de Costa Rica y sitios oficiales del MTSS.

* [x] Los **10 documentos de políticas** cubren todos los dominios obligatorios (vacaciones, permisos, incapacidades, jornada/teletrabajo, salarios/aguinaldo, beneficios, onboarding/salida, desempeño, conducta/acoso, privacidad).

* [x] Cada documento incluye encabezado con **Título, Versión, Fecha de vigencia y Responsable**.

* [x] Carpeta en Google Drive contiene variedad de formatos: al menos **1 PDF**, **1 Google Doc** y **1 Google Sheet**.

* [ ] Carpeta de Drive compartida con el correo de la Cuenta de Servicio de Google Cloud Console (rol Lector).

### Fase 2: Base de Datos e Ingesta Vectorial (10 pts)

* [x] Base de datos MySQL (`rrhh_ticotech`) creada con sus relaciones (`FOREIGN KEY`) e integridad referencial.

* [x] Al menos **50 colaboradores ficticios** cargados (100% datos simulados, cero datos reales) y **3 meses de historial** de movimientos, incapacidades y solicitudes.

* [x] ChromaDB levantado y poblado con los *chunks* (500–1000 tokens) y metadatos completos (`titulo`, `seccion`, `version`, `url_drive`).

* [x] Sincronización automática con Drive (`changes.list`) probada detectando archivos nuevos, editados y eliminados.

### Fase 3: Backend Multiagente y Seguridad (30 pts)

* [x] Los *prompts* de los 5 agentes están guardados en archivos separados dentro de `backend/src/prompts/`.

* [x] **Orquestador:** Enruta correctamente entre Políticas, Datos y Consultas Mixtas.

* [x] **Agente de Políticas:** Responde citando siempre el documento y enlace a Drive; admite cuando no sabe y ofrece escalar (ej. pregunta del bono de mascotas).

* [x] **Agente de Datos:** Filtra estrictamente por el `id` del usuario logueado.

* [x] **Prueba de Fuego de Privacidad (Cero Tolerancia):** El sistema rechaza responder el saldo de vacaciones de un compañero (Pregunta 21) y el salario del gerente general (Pregunta 22).

* [x] Todos los mensajes quedan registrados en la tabla `consultas_chat` con su latencia (`< 8000 ms`).

### Fase 4: Reportes Diarios y Frontend (15 pts + 10 pts Seguridad)

* [x] **Agente Analista:** Cron job configurado a las 7:00 a.m. y endpoint manual operativo.

* [x] El reporte JSON incluye los **7 indicadores SQL obligatorios** y el resumen ejecutivo de 3 a 5 frases sin inventar ningún número.

* [x] **Frontend Login:** Permite iniciar sesión diferenciando rol `colaborador` y rol `rrhh`.

* [x] **Frontend Chat:** Muestra mensajes, enlaces clicables a Drive y botón de escalamiento cuando no hay respuesta.

* [x] **Frontend Dashboard (Solo RRHH):** Bloqueado para colaboradores normales; muestra 4 KPIs, resumen ejecutivo, 2 gráficos (uno de tendencia de 30 días), tabla de solicitudes pendientes y selector de historial de reportes.

### Fase 5: Entregables Finales y Demo (10 pts + Extras)

* [x] Repositorio limpio sin claves expuestas (`.env` en `.gitignore` y `.env.example` incluido).

* [x] `README.md` con instrucciones claras de instalación y ejecución.

* [ ] Informe técnico final (8 a 12 páginas) con diagrama de arquitectura, ERD, prompts, estrategia de chunking y análisis de resultados.

* [ ] Hoja de evaluación completa con **45 preguntas** (25 base + 20 propias) alcanzando **$\ge 80\%$ de aciertos**.

* [ ] Video de respaldo de 5 minutos grabado y demo en vivo de 15 minutos ensayada.

* [x] *(Opcional - Puntos Extra)* Ticket de escalamiento guardado en `tickets_escalamiento` o agente validador activo.