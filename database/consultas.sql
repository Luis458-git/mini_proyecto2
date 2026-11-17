-- =============================================================================
-- ARCHIVO CENTRALIZADO DE CONSULTAS SQL — TicoTech HR Portal
-- Todas las consultas del sistema residen en la carpeta database/ (cero SQL en .js)
-- =============================================================================

-- @name: health_check
SELECT 1 AS ok, DATABASE() AS db;

-- =============================================================================
-- 1. AUTENTICACIÓN Y PERFILES
-- =============================================================================

-- @name: auth_obtener_usuario_por_id
SELECT c.id, c.nombre, c.email, c.rol, c.departamento_id, d.nombre AS departamento, p.titulo AS puesto
FROM colaboradores c
LEFT JOIN departamentos d ON c.departamento_id = d.id
LEFT JOIN puestos p ON c.puesto_id = p.id
WHERE c.id = ?;

-- @name: auth_obtener_usuario_por_email
SELECT c.id, c.nombre, c.email, c.rol, c.departamento_id, d.nombre AS departamento, p.titulo AS puesto
FROM colaboradores c
LEFT JOIN departamentos d ON c.departamento_id = d.id
LEFT JOIN puestos p ON c.puesto_id = p.id
WHERE c.email = ?;

-- @name: auth_perfiles_demo
SELECT c.id, c.nombre, c.email, c.rol, d.nombre AS departamento, p.titulo AS puesto
FROM colaboradores c
LEFT JOIN departamentos d ON c.departamento_id = d.id
LEFT JOIN puestos p ON c.puesto_id = p.id
WHERE c.id IN (2, 3, 6, 9)
ORDER BY c.rol DESC, c.nombre ASC;

-- =============================================================================
-- 2. AGENTE DE DATOS (datosAgent)
-- =============================================================================

-- @name: datos_rrhh_ausentes_hoy
SELECT c.nombre, d.nombre AS departamento, s.tipo, s.fecha_inicio, s.fecha_fin
FROM solicitudes s
JOIN colaboradores c ON s.colaborador_id = c.id
LEFT JOIN departamentos d ON c.departamento_id = d.id
WHERE s.estado = 'aprobada' AND CURRENT_DATE BETWEEN s.fecha_inicio AND s.fecha_fin;

-- @name: datos_rrhh_pasivo_vacaciones
SELECT c.nombre, d.nombre AS departamento, SUM(sv.dias_disponibles) AS dias_acumulados
FROM saldos_vacaciones sv
JOIN colaboradores c ON sv.colaborador_id = c.id
LEFT JOIN departamentos d ON c.departamento_id = d.id
GROUP BY c.id, c.nombre, d.nombre
HAVING dias_acumulados > 20
ORDER BY dias_acumulados DESC;

-- @name: datos_rrhh_conteo_solicitudes_pendientes
SELECT COUNT(*) AS total FROM solicitudes WHERE estado = 'pendiente';

-- @name: datos_rrhh_conteo_incapacidades_activas
SELECT COUNT(*) AS total FROM incapacidades WHERE CURRENT_DATE BETWEEN fecha_inicio AND fecha_fin;

-- @name: datos_colab_saldos_vacaciones
SELECT periodo, dias_asignados, dias_tomados, dias_disponibles
FROM saldos_vacaciones
WHERE colaborador_id = ?
ORDER BY periodo DESC;

-- @name: datos_colab_solicitudes_vacaciones
SELECT id, tipo, fecha_inicio, fecha_fin, dias_solicitados, estado
FROM solicitudes
WHERE colaborador_id = ? AND tipo = 'vacaciones'
ORDER BY creada_en DESC LIMIT 5;

-- @name: datos_colab_planillas
SELECT p.salario_bruto, p.monto_horas_extra, p.deduccion_ccss, p.deduccion_renta, p.deduccion_asociacion, p.salario_neto,
       pp.codigo AS nombre_periodo, pp.fecha_inicio, pp.fecha_fin
FROM planillas p
JOIN periodos_pago pp ON p.periodo_id = pp.id
WHERE p.colaborador_id = ?
ORDER BY pp.fecha_fin DESC LIMIT 3;

-- @name: datos_colab_incapacidades
SELECT numero_boleta, tipo, entidad, fecha_inicio, fecha_fin, dias, porcentaje_subsidio
FROM incapacidades
WHERE colaborador_id = ?
ORDER BY fecha_inicio DESC LIMIT 5;

-- @name: datos_colab_solicitudes_todas
SELECT id, tipo, fecha_inicio, fecha_fin, dias_solicitados, motivo, estado, creada_en
FROM solicitudes
WHERE colaborador_id = ?
ORDER BY creada_en DESC LIMIT 8;

-- @name: datos_colab_beneficios
SELECT b.nombre, b.proveedor, b.aporte_empresa_pct, cb.fecha_afiliacion, cb.estado
FROM colaborador_beneficios cb
JOIN beneficios b ON cb.beneficio_id = b.id
WHERE cb.colaborador_id = ?;

-- @name: datos_colab_perfil
SELECT c.id, c.nombre, c.email, c.fecha_ingreso, c.modalidad, c.tipo_contrato,
       d.nombre AS departamento, p.titulo AS puesto
FROM colaboradores c
LEFT JOIN departamentos d ON c.departamento_id = d.id
LEFT JOIN puestos p ON c.puesto_id = p.id
WHERE c.id = ?;

-- @name: datos_colab_total_vacaciones
SELECT SUM(dias_disponibles) AS total_vacaciones_disponibles
FROM saldos_vacaciones WHERE colaborador_id = ?;

-- =============================================================================
-- 3. AGENTE ANALISTA Y REPORTES DIARIOS (analistaAgent)
-- =============================================================================

-- @name: analista_ausentes_solicitudes
SELECT s.tipo, d.nombre AS departamento, COUNT(*) AS cantidad
FROM solicitudes s
JOIN colaboradores c ON s.colaborador_id = c.id
LEFT JOIN departamentos d ON c.departamento_id = d.id
WHERE s.estado = 'aprobada' AND ? BETWEEN s.fecha_inicio AND s.fecha_fin
GROUP BY s.tipo, d.nombre;

-- @name: analista_ausentes_incapacidades
SELECT 'incapacidad' AS tipo, d.nombre AS departamento, COUNT(*) AS cantidad
FROM incapacidades i
JOIN colaboradores c ON i.colaborador_id = c.id
LEFT JOIN departamentos d ON c.departamento_id = d.id
WHERE ? BETWEEN i.fecha_inicio AND i.fecha_fin
GROUP BY d.nombre;

-- @name: analista_solicitudes_pendientes
SELECT 
  COUNT(*) AS total_pendientes,
  SUM(CASE WHEN DATEDIFF(?, creada_en) > 3 THEN 1 ELSE 0 END) AS pendientes_mas_3_dias
FROM solicitudes
WHERE estado = 'pendiente';

-- @name: analista_incapacidades_mes
SELECT 
  COUNT(*) AS activas,
  IFNULL(SUM(dias), 0) AS dias_acumulados_mes
FROM incapacidades
WHERE (? BETWEEN fecha_inicio AND fecha_fin) OR (YEAR(fecha_inicio) = YEAR(?) AND MONTH(fecha_inicio) = MONTH(?));

-- @name: analista_movimientos_mes
SELECT 
  SUM(CASE WHEN tipo = 'contratacion' THEN 1 ELSE 0 END) AS ingresos_mes,
  SUM(CASE WHEN tipo = 'terminacion' THEN 1 ELSE 0 END) AS salidas_mes
FROM movimientos_personal
WHERE YEAR(fecha) = YEAR(?) AND MONTH(fecha) = MONTH(?);

-- @name: analista_colaboradores_activos
SELECT COUNT(*) AS total_activos FROM colaboradores WHERE estado = 'activo';

-- @name: analista_pasivo_vacacional
SELECT c.id, c.nombre, d.nombre AS departamento, SUM(sv.dias_disponibles) AS dias_acumulados
FROM saldos_vacaciones sv
JOIN colaboradores c ON sv.colaborador_id = c.id
LEFT JOIN departamentos d ON c.departamento_id = d.id
GROUP BY c.id, c.nombre, d.nombre
HAVING dias_acumulados > 20
ORDER BY dias_acumulados DESC;

-- @name: analista_uso_chatbot_ayer
SELECT 
  COUNT(*) AS total_consultas,
  IFNULL(ROUND(AVG(latencia_ms), 0), 0) AS latencia_promedio_ms,
  IFNULL(ROUND(SUM(CASE WHEN escalada = FALSE THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 1), 100.0) AS porcentaje_resueltas
FROM consultas_chat
WHERE DATE(fecha) = DATE_SUB(?, INTERVAL 1 DAY);

-- @name: analista_top_temas
SELECT intencion, COUNT(*) AS total
FROM consultas_chat
GROUP BY intencion
ORDER BY total DESC
LIMIT 5;

-- @name: analista_preguntas_escaladas
SELECT pregunta, fecha
FROM consultas_chat
WHERE escalada = TRUE OR resuelta = FALSE
ORDER BY fecha DESC
LIMIT 5;

-- @name: analista_guardar_reporte_diario
INSERT INTO reportes_diarios (fecha, datos_json, resumen_texto, generado_por)
VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  datos_json = VALUES(datos_json),
  resumen_texto = VALUES(resumen_texto),
  generado_por = VALUES(generado_por);

-- =============================================================================
-- 4. ORQUESTADOR, CHAT, INGESTA Y RUTAS DE DASHBOARD
-- =============================================================================

-- @name: orquestador_registrar_consulta
INSERT INTO consultas_chat
  (colaborador_id, sesion_id, pregunta, intencion, agente_utilizado, documentos_citados, confianza_rag, resuelta, escalada, latencia_ms)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- @name: ingesta_actualizar_documento
UPDATE documentos_politicas 
SET total_chunks = ?, ultima_sincronizacion = NOW() 
WHERE drive_file_id = ?;

-- @name: chat_historial_usuario
SELECT id, sesion_id, pregunta, intencion, agente_utilizado, documentos_citados,
       confianza_rag, resuelta, escalada, latencia_ms, fecha
FROM consultas_chat
WHERE colaborador_id = ?
ORDER BY fecha DESC
LIMIT 30;

-- @name: chat_crear_ticket_escalamiento
INSERT INTO tickets_escalamiento (consulta_id, colaborador_id, asunto, prioridad, estado, respuesta_rrhh)
VALUES (?, ?, ?, 'media', 'abierto', NULL);

-- @name: chat_marcar_consulta_escalada
UPDATE consultas_chat SET escalada = TRUE, resuelta = FALSE WHERE id = ?;

-- @name: reportes_obtener_ultimo
SELECT id, fecha, datos_json, resumen_texto, generado_por, creado_en
FROM reportes_diarios
ORDER BY fecha DESC, id DESC
LIMIT 1;

-- @name: reportes_obtener_historial
SELECT id, fecha, resumen_texto, generado_por, creado_en
FROM reportes_diarios
ORDER BY fecha DESC
LIMIT 30;

-- @name: reportes_tendencia_30d
SELECT DATE(fecha) AS fecha_dia, COUNT(*) AS total_consultas,
       SUM(CASE WHEN escalada = TRUE THEN 1 ELSE 0 END) AS escaladas,
       ROUND(AVG(latencia_ms), 0) AS latencia_promedio
FROM consultas_chat
WHERE fecha >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY DATE(fecha)
ORDER BY fecha_dia ASC;

-- @name: reportes_colaboradores_por_departamento
SELECT d.nombre AS departamento, COUNT(c.id) AS total_colaboradores
FROM departamentos d
LEFT JOIN colaboradores c ON d.id = c.departamento_id
GROUP BY d.id, d.nombre;

-- @name: solicitudes_listar_pendientes
SELECT 
  s.id,
  s.tipo,
  s.fecha_inicio,
  s.fecha_fin,
  s.dias_solicitados,
  s.motivo,
  s.estado,
  s.creada_en,
  DATEDIFF(CURRENT_TIMESTAMP, s.creada_en) AS dias_en_espera,
  (DATEDIFF(CURRENT_TIMESTAMP, s.creada_en) > 3) AS alerta_retraso,
  c.nombre AS colaborador_nombre,
  c.email AS colaborador_email,
  d.nombre AS departamento
FROM solicitudes s
JOIN colaboradores c ON s.colaborador_id = c.id
LEFT JOIN departamentos d ON c.departamento_id = d.id
WHERE s.estado = 'pendiente'
ORDER BY dias_en_espera DESC, s.creada_en ASC;
