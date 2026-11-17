-- =============================================================================
-- Base de Datos: rrhh_ticotech | Proyecto: TicoTech HR Portal (Costa Rica)
-- Motor: MySQL 8.0+ | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =============================================================================

DROP DATABASE IF EXISTS rrhh_ticotech;
CREATE DATABASE rrhh_ticotech
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE rrhh_ticotech;

-- =============================================================================
-- SECCIÓN 1: DDL (22 TABLAS)
-- =============================================================================

-- 1. departamentos
CREATE TABLE departamentos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  centro_costo VARCHAR(30) NOT NULL,
  presupuesto_anual DECIMAL(14,2) NOT NULL,
  gerente_id INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_departamentos_nombre (nombre),
  UNIQUE KEY uk_departamentos_centro_costo (centro_costo),
  KEY idx_departamentos_gerente (gerente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. puestos
CREATE TABLE puestos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  departamento_id INT UNSIGNED NOT NULL,
  titulo VARCHAR(120) NOT NULL,
  nivel ENUM('Junior','Mid','Senior','Lead','Gerencia') NOT NULL,
  salario_base_min DECIMAL(12,2) NOT NULL,
  salario_base_max DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_puestos_depto_titulo (departamento_id, titulo),
  KEY idx_puestos_departamento (departamento_id),
  KEY idx_puestos_nivel (nivel),
  CONSTRAINT fk_puestos_departamento
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. colaboradores
CREATE TABLE colaboradores (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cedula_ficticia VARCHAR(20) NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  telefono VARCHAR(25) NOT NULL,
  departamento_id INT UNSIGNED NULL,
  puesto_id INT UNSIGNED NULL,
  jefe_id INT UNSIGNED NULL,
  fecha_ingreso DATE NOT NULL,
  tipo_contrato ENUM('indefinido','plazo_fijo','servicios_profesionales') NOT NULL DEFAULT 'indefinido',
  modalidad ENUM('presencial','hibrido','teletrabajo') NOT NULL DEFAULT 'hibrido',
  rol ENUM('colaborador','rrhh','admin') NOT NULL DEFAULT 'colaborador',
  estado ENUM('activo','inactivo','suspendido') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (id),
  UNIQUE KEY uk_colaboradores_cedula (cedula_ficticia),
  UNIQUE KEY uk_colaboradores_email (email),
  KEY idx_colaboradores_departamento (departamento_id),
  KEY idx_colaboradores_puesto (puesto_id),
  KEY idx_colaboradores_jefe (jefe_id),
  KEY idx_colaboradores_rol_estado (rol, estado),
  KEY idx_colaboradores_nombre (nombre),
  CONSTRAINT fk_colaboradores_departamento
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_colaboradores_puesto
    FOREIGN KEY (puesto_id) REFERENCES puestos(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_colaboradores_jefe
    FOREIGN KEY (jefe_id) REFERENCES colaboradores(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FK diferida para evitar dependencia circular entre departamentos y colaboradores
ALTER TABLE departamentos
  ADD CONSTRAINT fk_departamentos_gerente
    FOREIGN KEY (gerente_id) REFERENCES colaboradores(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. saldos_vacaciones
CREATE TABLE saldos_vacaciones (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  colaborador_id INT UNSIGNED NOT NULL,
  periodo VARCHAR(20) NOT NULL,
  dias_asignados DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  dias_tomados DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  dias_disponibles DECIMAL(5,2) GENERATED ALWAYS AS (dias_asignados - dias_tomados) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uk_saldos_colab_periodo (colaborador_id, periodo),
  KEY idx_saldos_disponibles (dias_disponibles),
  CONSTRAINT fk_saldos_colaborador
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. solicitudes
CREATE TABLE solicitudes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  colaborador_id INT UNSIGNED NOT NULL,
  tipo ENUM('vacaciones','permiso_paternidad','permiso_maternidad','permiso_matrimonio','permiso_fallecimiento','permiso_personal','licencia_sin_goce') NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  dias_solicitados DECIMAL(5,2) NOT NULL,
  motivo TEXT NOT NULL,
  estado ENUM('pendiente','aprobada','rechazada','cancelada') NOT NULL DEFAULT 'pendiente',
  aprobador_id INT UNSIGNED NULL,
  fecha_resolucion DATETIME NULL,
  creada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_solicitudes_colaborador (colaborador_id),
  KEY idx_solicitudes_aprobador (aprobador_id),
  KEY idx_solicitudes_estado (estado),
  KEY idx_solicitudes_fechas (fecha_inicio, fecha_fin),
  KEY idx_solicitudes_creada_en (creada_en),
  CONSTRAINT fk_solicitudes_colaborador
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_solicitudes_aprobador
    FOREIGN KEY (aprobador_id) REFERENCES colaboradores(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. incapacidades
CREATE TABLE incapacidades (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  colaborador_id INT UNSIGNED NOT NULL,
  numero_boleta VARCHAR(40) NOT NULL,
  tipo ENUM('enfermedad_comun','riesgo_trabajo','maternidad','accidente_transito') NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  dias INT UNSIGNED NOT NULL,
  entidad ENUM('CCSS','INS') NOT NULL,
  porcentaje_subsidio DECIMAL(5,2) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_incapacidades_boleta (numero_boleta),
  KEY idx_incapacidades_colaborador (colaborador_id),
  KEY idx_incapacidades_entidad (entidad),
  KEY idx_incapacidades_fechas (fecha_inicio, fecha_fin),
  CONSTRAINT fk_incapacidades_colaborador
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. movimientos_personal
CREATE TABLE movimientos_personal (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  colaborador_id INT UNSIGNED NOT NULL,
  tipo ENUM('contratacion','ascenso','traslado','ajuste_salarial','cambio_modalidad','suspension','terminacion') NOT NULL,
  puesto_anterior_id INT UNSIGNED NULL,
  puesto_nuevo_id INT UNSIGNED NULL,
  fecha DATE NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_movimientos_colaborador (colaborador_id),
  KEY idx_movimientos_puesto_ant (puesto_anterior_id),
  KEY idx_movimientos_puesto_nvo (puesto_nuevo_id),
  KEY idx_movimientos_fecha (fecha),
  KEY idx_movimientos_tipo (tipo),
  CONSTRAINT fk_movimientos_colaborador
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_movimientos_puesto_anterior
    FOREIGN KEY (puesto_anterior_id) REFERENCES puestos(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_movimientos_puesto_nuevo
    FOREIGN KEY (puesto_nuevo_id) REFERENCES puestos(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. feriados
CREATE TABLE feriados (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  fecha DATE NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  tipo ENUM('pago_obligatorio','pago_no_obligatorio') NOT NULL,
  se_traslada_a DATE NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_feriados_fecha (fecha),
  KEY idx_feriados_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. registro_asistencia
CREATE TABLE registro_asistencia (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  colaborador_id INT UNSIGNED NOT NULL,
  fecha DATE NOT NULL,
  hora_entrada TIME NOT NULL,
  hora_salida TIME NULL,
  modalidad_dia ENUM('presencial','teletrabajo') NOT NULL,
  tardia_minutos INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_asistencia_colab_fecha (colaborador_id, fecha),
  KEY idx_asistencia_fecha (fecha),
  KEY idx_asistencia_tardia (tardia_minutos),
  CONSTRAINT fk_asistencia_colaborador
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. horas_extra
CREATE TABLE horas_extra (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  colaborador_id INT UNSIGNED NOT NULL,
  fecha DATE NOT NULL,
  cantidad_horas DECIMAL(4,2) NOT NULL,
  tipo_jornada ENUM('diurna','mixta','nocturna','feriado_descanso') NOT NULL,
  factor_pago DECIMAL(3,2) NOT NULL DEFAULT 1.50,
  estado ENUM('pendiente','aprobada','rechazada','pagada') NOT NULL DEFAULT 'pendiente',
  aprobador_id INT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_horas_extra_colaborador (colaborador_id),
  KEY idx_horas_extra_aprobador (aprobador_id),
  KEY idx_horas_extra_fecha (fecha),
  KEY idx_horas_extra_estado (estado),
  CONSTRAINT fk_horas_extra_colaborador
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_horas_extra_aprobador
    FOREIGN KEY (aprobador_id) REFERENCES colaboradores(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. periodos_pago
CREATE TABLE periodos_pago (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(25) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  fecha_pago_programada DATE NOT NULL,
  estado ENUM('abierto','en_proceso','pagado','cerrado') NOT NULL DEFAULT 'abierto',
  PRIMARY KEY (id),
  UNIQUE KEY uk_periodos_pago_codigo (codigo),
  KEY idx_periodos_pago_fechas (fecha_inicio, fecha_fin),
  KEY idx_periodos_pago_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. planillas
CREATE TABLE planillas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  periodo_id INT UNSIGNED NOT NULL,
  colaborador_id INT UNSIGNED NOT NULL,
  salario_bruto DECIMAL(12,2) NOT NULL,
  monto_horas_extra DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  deduccion_ccss DECIMAL(12,2) NOT NULL,
  deduccion_renta DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  deduccion_asociacion DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  salario_neto DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_planillas_periodo_colab (periodo_id, colaborador_id),
  KEY idx_planillas_colaborador (colaborador_id),
  CONSTRAINT fk_planillas_periodo
    FOREIGN KEY (periodo_id) REFERENCES periodos_pago(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_planillas_colaborador
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. beneficios
CREATE TABLE beneficios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  proveedor VARCHAR(120) NOT NULL,
  aporte_empresa_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  requiere_periodo_prueba BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uk_beneficios_nombre (nombre),
  KEY idx_beneficios_proveedor (proveedor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. colaborador_beneficios
CREATE TABLE colaborador_beneficios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  colaborador_id INT UNSIGNED NOT NULL,
  beneficio_id INT UNSIGNED NOT NULL,
  fecha_afiliacion DATE NOT NULL,
  estado ENUM('activo','suspendido','cancelado') NOT NULL DEFAULT 'activo',
  beneficiarios_extra INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_colab_beneficio (colaborador_id, beneficio_id),
  KEY idx_colab_beneficios_beneficio (beneficio_id),
  KEY idx_colab_beneficios_estado (estado),
  CONSTRAINT fk_colab_beneficios_colaborador
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_colab_beneficios_beneficio
    FOREIGN KEY (beneficio_id) REFERENCES beneficios(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. evaluaciones_desempeno
CREATE TABLE evaluaciones_desempeno (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  colaborador_id INT UNSIGNED NOT NULL,
  evaluador_id INT UNSIGNED NULL,
  periodo VARCHAR(25) NOT NULL,
  fecha_programada DATE NOT NULL,
  fecha_completada DATE NULL,
  calificacion DECIMAL(3,2) NULL,
  plan_mejora BOOLEAN NOT NULL DEFAULT FALSE,
  comentarios TEXT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_eval_colab_periodo (colaborador_id, periodo),
  KEY idx_eval_evaluador (evaluador_id),
  KEY idx_eval_periodo (periodo),
  KEY idx_eval_plan_mejora (plan_mejora),
  CONSTRAINT fk_eval_colaborador
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_eval_evaluador
    FOREIGN KEY (evaluador_id) REFERENCES colaboradores(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. capacitaciones
CREATE TABLE capacitaciones (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  titulo VARCHAR(160) NOT NULL,
  categoria VARCHAR(80) NOT NULL,
  horas_duracion INT UNSIGNED NOT NULL,
  fecha_inicio DATE NOT NULL,
  cupos INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_capacitaciones_categoria (categoria),
  KEY idx_capacitaciones_fecha (fecha_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. capacitaciones_inscripciones
CREATE TABLE capacitaciones_inscripciones (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  capacitacion_id INT UNSIGNED NOT NULL,
  colaborador_id INT UNSIGNED NOT NULL,
  estado ENUM('inscrito','en_curso','completado','retirado') NOT NULL DEFAULT 'inscrito',
  nota_final DECIMAL(5,2) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cap_insc_cap_colab (capacitacion_id, colaborador_id),
  KEY idx_cap_insc_colaborador (colaborador_id),
  KEY idx_cap_insc_estado (estado),
  CONSTRAINT fk_cap_insc_capacitacion
    FOREIGN KEY (capacitacion_id) REFERENCES capacitaciones(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cap_insc_colaborador
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. denuncias_etica
CREATE TABLE denuncias_etica (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo_seguimiento VARCHAR(30) NOT NULL,
  reportante_id INT UNSIGNED NULL,
  categoria ENUM('acoso_laboral','hostigamiento_sexual','discriminacion','conflicto_interes','privacidad_datos','otro') NOT NULL,
  descripcion TEXT NOT NULL,
  estado ENUM('recibida','en_investigacion','resuelta','archivada') NOT NULL DEFAULT 'recibida',
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_denuncias_codigo (codigo_seguimiento),
  KEY idx_denuncias_reportante (reportante_id),
  KEY idx_denuncias_estado (estado),
  KEY idx_denuncias_categoria (categoria),
  CONSTRAINT fk_denuncias_reportante
    FOREIGN KEY (reportante_id) REFERENCES colaboradores(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. documentos_politicas
CREATE TABLE documentos_politicas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  drive_file_id VARCHAR(120) NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  version VARCHAR(20) NOT NULL,
  fecha_vigencia DATE NOT NULL,
  responsable VARCHAR(150) NOT NULL,
  url_drive VARCHAR(255) NOT NULL,
  ultima_sincronizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_chunks INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_doc_politicas_drive_id (drive_file_id),
  KEY idx_doc_politicas_titulo (titulo),
  KEY idx_doc_politicas_vigencia (fecha_vigencia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. consultas_chat
CREATE TABLE consultas_chat (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  colaborador_id INT UNSIGNED NOT NULL,
  sesion_id VARCHAR(64) NOT NULL,
  pregunta TEXT NOT NULL,
  intencion ENUM('politicas_rrhh','datos_personales','analitica_rrhh','privacidad_rechazada','escalamiento_humano','general') NOT NULL,
  agente_utilizado ENUM('orquestador','politicasAgent','datosAgent','analistaAgent') NOT NULL,
  documentos_citados JSON NULL,
  confianza_rag DECIMAL(4,3) NULL,
  resuelta BOOLEAN NOT NULL DEFAULT TRUE,
  escalada BOOLEAN NOT NULL DEFAULT FALSE,
  latencia_ms INT UNSIGNED NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_consultas_colaborador (colaborador_id),
  KEY idx_consultas_sesion (sesion_id),
  KEY idx_consultas_intencion (intencion),
  KEY idx_consultas_agente (agente_utilizado),
  KEY idx_consultas_escalada (escalada),
  KEY idx_consultas_fecha (fecha),
  CONSTRAINT fk_consultas_colaborador
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. tickets_escalamiento
CREATE TABLE tickets_escalamiento (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  consulta_id INT UNSIGNED NULL,
  colaborador_id INT UNSIGNED NOT NULL,
  asignado_rrhh_id INT UNSIGNED NULL,
  asunto VARCHAR(200) NOT NULL,
  prioridad ENUM('baja','media','alta','urgente') NOT NULL DEFAULT 'media',
  estado ENUM('abierto','en_revision','resuelto','cerrado') NOT NULL DEFAULT 'abierto',
  respuesta_rrhh TEXT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tickets_consulta (consulta_id),
  KEY idx_tickets_colaborador (colaborador_id),
  KEY idx_tickets_asignado (asignado_rrhh_id),
  KEY idx_tickets_estado_prioridad (estado, prioridad),
  CONSTRAINT fk_tickets_consulta
    FOREIGN KEY (consulta_id) REFERENCES consultas_chat(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_tickets_colaborador
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tickets_asignado_rrhh
    FOREIGN KEY (asignado_rrhh_id) REFERENCES colaboradores(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. reportes_diarios
CREATE TABLE reportes_diarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  fecha DATE NOT NULL,
  datos_json JSON NOT NULL,
  resumen_texto TEXT NOT NULL,
  generado_por VARCHAR(100) NOT NULL DEFAULT 'cronJobs_analistaAgent',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_reportes_diarios_fecha (fecha),
  KEY idx_reportes_generado_por (generado_por)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SECCIÓN 2: DML (DATOS SIMULADOS DE COSTA RICA - SEPTIEMBRE A NOVIEMBRE 2026)
-- =============================================================================

-- 1. departamentos (5 registros; gerente_id se asigna tras insertar colaboradores)
INSERT INTO departamentos (id, nombre, centro_costo, presupuesto_anual, gerente_id) VALUES
  (1, 'Ingeniería de Software', 'CC-TEC-001', 420000000.00, NULL),
  (2, 'Talento Humano', 'CC-RRHH-002', 95000000.00, NULL),
  (3, 'Operaciones y Soporte TI', 'CC-OPS-003', 145000000.00, NULL),
  (4, 'Producto y Diseño UX', 'CC-PROD-004', 130000000.00, NULL),
  (5, 'Finanzas y Administración', 'CC-FIN-005', 110000000.00, NULL);

-- 2. puestos (12 registros)
INSERT INTO puestos (id, departamento_id, titulo, nivel, salario_base_min, salario_base_max) VALUES
  (1, 1, 'Engineering Manager', 'Gerencia', 2800000.00, 3800000.00),
  (2, 1, 'Desarrollador Full Stack Senior', 'Senior', 1900000.00, 2700000.00),
  (3, 1, 'Desarrollador Full Stack Mid', 'Mid', 1300000.00, 1850000.00),
  (4, 1, 'Ingeniero QA Automation', 'Mid', 1150000.00, 1650000.00),
  (5, 2, 'Directora de Talento Humano', 'Gerencia', 2200000.00, 3000000.00),
  (6, 2, 'Especialista de RRHH y Planillas', 'Senior', 1200000.00, 1700000.00),
  (7, 3, 'Gerente de Operaciones TI', 'Gerencia', 2100000.00, 2900000.00),
  (8, 3, 'Ingeniero DevOps y Cloud', 'Senior', 1750000.00, 2450000.00),
  (9, 4, 'Product Manager', 'Lead', 2000000.00, 2800000.00),
  (10, 4, 'Diseñador UX/UI Senior', 'Senior', 1450000.00, 2050000.00),
  (11, 5, 'Gerente Financiero y Administrativo', 'Gerencia', 2400000.00, 3300000.00),
  (12, 5, 'Analista Contable y Financiero', 'Mid', 950000.00, 1400000.00);

-- 3. colaboradores (50 registros: 1 admin, 4 rrhh, 45 colaborador | 45 activos, 5 inactivos)
INSERT INTO colaboradores (id, cedula_ficticia, nombre, email, telefono, departamento_id, puesto_id, jefe_id, fecha_ingreso, tipo_contrato, modalidad, rol, estado) VALUES
  (1, '1-9001-0101', 'Roberto Chavarría Méndez', 'roberto.chavarria@ticotech.cr', '+506 8801-1001', 5, 11, NULL, '2020-03-02', 'indefinido', 'hibrido', 'admin', 'activo'),
  (2, '1-9001-0102', 'Valeria Quesada Brenes', 'valeria.quesada@ticotech.cr', '+506 8801-1002', 2, 5, 1, '2020-06-15', 'indefinido', 'hibrido', 'rrhh', 'activo'),
  (3, '1-9001-0103', 'Andrés Monge Villalobos', 'andres.monge@ticotech.cr', '+506 8801-1003', 1, 1, 1, '2020-08-10', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (4, '2-9002-0104', 'Mauricio Araya Segura', 'mauricio.araya@ticotech.cr', '+506 8801-1004', 3, 7, 1, '2021-01-18', 'indefinido', 'presencial', 'colaborador', 'activo'),
  (5, '1-9001-0105', 'Carolina Jiménez Salazar', 'carolina.jimenez@ticotech.cr', '+506 8801-1005', 4, 9, 1, '2021-04-05', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (6, '3-9003-0106', 'Daniela Mora Cordero', 'daniela.mora@ticotech.cr', '+506 8801-1006', 2, 6, 2, '2022-02-14', 'indefinido', 'hibrido', 'rrhh', 'activo'),
  (7, '4-9004-0107', 'Esteban Alpízar Chacón', 'esteban.alpizar@ticotech.cr', '+506 8801-1007', 2, 6, 2, '2023-05-08', 'indefinido', 'hibrido', 'rrhh', 'activo'),
  (8, '1-9001-0108', 'Sofía Navarro Ureña', 'sofia.navarro@ticotech.cr', '+506 8801-1008', 2, 6, 2, '2024-09-02', 'indefinido', 'presencial', 'rrhh', 'activo'),
  (9, '1-9001-0109', 'Alejandro Vargas Castro', 'alejandro.vargas@ticotech.cr', '+506 8801-1009', 1, 2, 3, '2021-07-12', 'indefinido', 'teletrabajo', 'colaborador', 'activo'),
  (10, '2-9002-0110', 'Priscila Solís Fallas', 'priscila.solis@ticotech.cr', '+506 8801-1010', 1, 2, 3, '2021-11-01', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (11, '1-9001-0111', 'Gabriel Hernández Quirós', 'gabriel.hernandez@ticotech.cr', '+506 8801-1011', 1, 2, 3, '2022-03-21', 'indefinido', 'teletrabajo', 'colaborador', 'activo'),
  (12, '3-9003-0112', 'Natalia Calderón Rojas', 'natalia.calderon@ticotech.cr', '+506 8801-1012', 1, 2, 3, '2022-06-06', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (13, '4-9004-0113', 'Sebastián Ramírez Picado', 'sebastian.ramirez@ticotech.cr', '+506 8801-1013', 1, 2, 3, '2022-09-19', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (14, '5-9005-0114', 'Mariana Fonseca Guzmán', 'mariana.fonseca@ticotech.cr', '+506 8801-1014', 1, 2, 3, '2023-01-09', 'indefinido', 'teletrabajo', 'colaborador', 'activo'),
  (15, '1-9001-0115', 'Diego Elizondo Valverde', 'diego.elizondo@ticotech.cr', '+506 8801-1015', 1, 3, 3, '2023-04-17', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (16, '2-9002-0116', 'Camila Aguilar Rodríguez', 'camila.aguilar@ticotech.cr', '+506 8801-1016', 1, 3, 3, '2023-07-03', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (17, '6-9006-0117', 'Fabián Coto Madrigal', 'fabian.coto@ticotech.cr', '+506 8801-1017', 1, 3, 3, '2023-10-16', 'indefinido', 'teletrabajo', 'colaborador', 'activo'),
  (18, '1-9001-0118', 'Laura Chacón Peralta', 'laura.chacon@ticotech.cr', '+506 8801-1018', 1, 3, 3, '2024-01-22', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (19, '7-9007-0119', 'Josué Mata Barquero', 'josue.mata@ticotech.cr', '+506 8801-1019', 1, 3, 3, '2024-04-08', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (20, '1-9001-0120', 'Mónica Sibaja Esquivel', 'monica.sibaja@ticotech.cr', '+506 8801-1020', 1, 3, 3, '2024-08-19', 'indefinido', 'teletrabajo', 'colaborador', 'activo'),
  (21, '3-9003-0121', 'Luis Carlos Méndez Soto', 'luis.mendez@ticotech.cr', '+506 8801-1021', 1, 3, 3, '2025-02-03', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (22, '2-9002-0122', 'Andrea Campos Bolaños', 'andrea.campos@ticotech.cr', '+506 8801-1022', 1, 4, 3, '2023-02-13', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (23, '1-9001-0123', 'Kevin Murillo Arce', 'kevin.murillo@ticotech.cr', '+506 8801-1023', 1, 4, 3, '2024-05-20', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (24, '4-9004-0124', 'Paula Zamora Oviedo', 'paula.zamora@ticotech.cr', '+506 8801-1024', 1, 4, 3, '2025-06-09', 'indefinido', 'teletrabajo', 'colaborador', 'activo'),
  (25, '1-9001-0125', 'Marco Vinicio Arias León', 'marco.arias@ticotech.cr', '+506 8801-1025', 1, 4, 3, '2026-09-07', 'plazo_fijo', 'hibrido', 'colaborador', 'activo'),
  (26, '2-9002-0126', 'Rebeca Alvarado Sancho', 'rebeca.alvarado@ticotech.cr', '+506 8801-1026', 1, 3, 3, '2026-10-05', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (27, '1-9001-0127', 'Cristian Gómez Porras', 'cristian.gomez@ticotech.cr', '+506 8801-1027', 3, 8, 4, '2021-09-06', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (28, '3-9003-0128', 'Tatiana Blanco Vindas', 'tatiana.blanco@ticotech.cr', '+506 8801-1028', 3, 8, 4, '2022-07-18', 'indefinido', 'teletrabajo', 'colaborador', 'activo'),
  (29, '5-9005-0129', 'Óscar Delgado Núñez', 'oscar.delgado@ticotech.cr', '+506 8801-1029', 3, 8, 4, '2023-03-27', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (30, '1-9001-0130', 'Gloriana Salazar Herrera', 'gloriana.salazar@ticotech.cr', '+506 8801-1030', 3, 8, 4, '2024-02-12', 'indefinido', 'presencial', 'colaborador', 'activo'),
  (31, '2-9002-0131', 'Ignacio Morales Trejos', 'ignacio.morales@ticotech.cr', '+506 8801-1031', 3, 8, 4, '2024-11-04', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (32, '4-9004-0132', 'Melissa Valverde Chacón', 'melissa.valverde@ticotech.cr', '+506 8801-1032', 3, 8, 4, '2025-04-14', 'indefinido', 'presencial', 'colaborador', 'activo'),
  (33, '6-9006-0133', 'Jorge Luis Vega Conejo', 'jorge.vega@ticotech.cr', '+506 8801-1033', 3, 8, 4, '2025-09-01', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (34, '1-9001-0134', 'Adriana Salas Rojas', 'adriana.salas@ticotech.cr', '+506 8801-1034', 3, 8, 4, '2026-09-21', 'indefinido', 'presencial', 'colaborador', 'activo'),
  (35, '1-9001-0135', 'Valentina Céspedes Acuña', 'valentina.cespedes@ticotech.cr', '+506 8801-1035', 4, 10, 5, '2022-01-17', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (36, '2-9002-0136', 'Rodrigo Villalobos Pizarro', 'rodrigo.villalobos@ticotech.cr', '+506 8801-1036', 4, 10, 5, '2022-10-10', 'indefinido', 'teletrabajo', 'colaborador', 'activo'),
  (37, '3-9003-0137', 'Jimena Rojas Zúñiga', 'jimena.rojas@ticotech.cr', '+506 8801-1037', 4, 10, 5, '2023-08-21', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (38, '1-9001-0138', 'Santiago Umaña Barrantes', 'santiago.umana@ticotech.cr', '+506 8801-1038', 4, 10, 5, '2024-06-03', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (39, '4-9004-0139', 'Fiorella Guzmán Carvajal', 'fiorella.guzman@ticotech.cr', '+506 8801-1039', 4, 10, 5, '2025-03-10', 'indefinido', 'teletrabajo', 'colaborador', 'activo'),
  (40, '7-9007-0140', 'Pablo Emilio Chaves Marín', 'pablo.chaves@ticotech.cr', '+506 8801-1040', 4, 9, 5, '2025-11-17', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (41, '1-9001-0141', 'Silvia Benavides Corrales', 'silvia.benavides@ticotech.cr', '+506 8801-1041', 5, 12, 1, '2021-05-10', 'indefinido', 'presencial', 'colaborador', 'activo'),
  (42, '2-9002-0142', 'Randall Barboza Murillo', 'randall.barboza@ticotech.cr', '+506 8801-1042', 5, 12, 1, '2022-08-01', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (43, '3-9003-0143', 'Karina Solano Ureña', 'karina.solano@ticotech.cr', '+506 8801-1043', 5, 12, 1, '2023-11-13', 'indefinido', 'presencial', 'colaborador', 'activo'),
  (44, '1-9001-0144', 'Héctor Sibaja Garro', 'hector.sibaja@ticotech.cr', '+506 8801-1044', 5, 12, 1, '2024-10-07', 'indefinido', 'hibrido', 'colaborador', 'activo'),
  (45, '5-9005-0145', 'Lucía Méndez Paniagua', 'lucia.mendez@ticotech.cr', '+506 8801-1045', 5, 12, 1, '2026-09-14', 'servicios_profesionales', 'hibrido', 'colaborador', 'activo'),
  (46, '1-9001-0146', 'Kenneth Quesada López', 'kenneth.quesada@ticotech.cr', '+506 8801-1046', 1, 3, 3, '2023-06-05', 'indefinido', 'hibrido', 'colaborador', 'inactivo'),
  (47, '2-9002-0147', 'Yendry Fallas Montero', 'yendry.fallas@ticotech.cr', '+506 8801-1047', 1, 4, 3, '2024-03-11', 'indefinido', 'teletrabajo', 'colaborador', 'inactivo'),
  (48, '3-9003-0148', 'Bryan Torres Calvo', 'bryan.torres@ticotech.cr', '+506 8801-1048', 3, 8, 4, '2022-11-21', 'indefinido', 'presencial', 'colaborador', 'inactivo'),
  (49, '4-9004-0149', 'Natalia Picado Ramírez', 'natalia.picado@ticotech.cr', '+506 8801-1049', 4, 10, 5, '2024-07-15', 'indefinido', 'hibrido', 'colaborador', 'inactivo'),
  (50, '1-9001-0150', 'Fernando Quirós Badilla', 'fernando.quiros@ticotech.cr', '+506 8801-1050', 5, 12, 1, '2025-01-20', 'plazo_fijo', 'presencial', 'colaborador', 'inactivo');

-- Asignación de gerentes a cada departamento
UPDATE departamentos SET gerente_id = 3 WHERE id = 1;
UPDATE departamentos SET gerente_id = 2 WHERE id = 2;
UPDATE departamentos SET gerente_id = 4 WHERE id = 3;
UPDATE departamentos SET gerente_id = 5 WHERE id = 4;
UPDATE departamentos SET gerente_id = 1 WHERE id = 5;

-- 4. saldos_vacaciones (50 registros; 9 con >20 días disponibles para pasivo laboral)
INSERT INTO saldos_vacaciones (colaborador_id, periodo, dias_asignados, dias_tomados) VALUES
  (1, '2026', 25.00, 2.00),
  (2, '2026', 25.00, 3.00),
  (3, '2026', 25.00, 4.00),
  (4, '2026', 20.00, 8.00),
  (5, '2026', 15.00, 9.50),
  (6, '2026', 16.25, 11.00),
  (7, '2026', 17.50, 2.00),
  (8, '2026', 18.75, 3.50),
  (9, '2026', 25.00, 2.00),
  (10, '2026', 25.00, 3.00),
  (11, '2026', 16.25, 8.00),
  (12, '2026', 25.00, 1.00),
  (13, '2026', 18.75, 11.00),
  (14, '2026', 20.00, 2.00),
  (15, '2026', 15.00, 3.50),
  (16, '2026', 16.25, 5.00),
  (17, '2026', 17.50, 6.50),
  (18, '2026', 18.75, 8.00),
  (19, '2026', 20.00, 9.50),
  (20, '2026', 15.00, 11.00),
  (21, '2026', 16.25, 2.00),
  (22, '2026', 17.50, 3.50),
  (23, '2026', 18.75, 5.00),
  (24, '2026', 20.00, 6.50),
  (25, '2026', 2.50, 0.00),
  (26, '2026', 2.50, 0.00),
  (27, '2026', 25.00, 4.00),
  (28, '2026', 18.75, 5.00),
  (29, '2026', 20.00, 3.50),
  (30, '2026', 15.00, 5.00),
  (31, '2026', 16.25, 6.50),
  (32, '2026', 17.50, 8.00),
  (33, '2026', 18.75, 9.50),
  (34, '2026', 2.50, 0.00),
  (35, '2026', 25.00, 4.00),
  (36, '2026', 16.25, 3.50),
  (37, '2026', 17.50, 5.00),
  (38, '2026', 18.75, 6.50),
  (39, '2026', 20.00, 8.00),
  (40, '2026', 15.00, 9.50),
  (41, '2026', 25.00, 2.00),
  (42, '2026', 17.50, 5.00),
  (43, '2026', 18.75, 3.50),
  (44, '2026', 20.00, 5.00),
  (45, '2026', 2.50, 0.00),
  (46, '2026', 10.00, 10.00),
  (47, '2026', 10.00, 10.00),
  (48, '2026', 10.00, 10.00),
  (49, '2026', 10.00, 10.00),
  (50, '2026', 10.00, 10.00);

-- 5. solicitudes (35 registros: 5 activas hoy 2026-11-17, 10 pendientes >3 días)
INSERT INTO solicitudes (colaborador_id, tipo, fecha_inicio, fecha_fin, dias_solicitados, motivo, estado, aprobador_id, fecha_resolucion, creada_en) VALUES
  (11, 'vacaciones', '2026-11-16', '2026-11-20', 5.00, 'Vacaciones anuales programadas con familia en Guanacaste', 'aprobada', 3, '2026-10-20 10:15:00', '2026-10-16 09:00:00'),
  (16, 'permiso_paternidad', '2026-11-11', '2026-11-24', 10.00, 'Licencia de paternidad (10 días hábiles según política TicoTech)', 'aprobada', 3, '2026-11-11 08:30:00', '2026-11-10 16:40:00'),
  (29, 'vacaciones', '2026-11-17', '2026-11-18', 2.00, 'Descanso personal y trámites de renovación de pasaporte', 'aprobada', 4, '2026-11-12 11:20:00', '2026-11-11 14:10:00'),
  (36, 'permiso_matrimonio', '2026-11-16', '2026-11-18', 3.00, 'Licencia remunerada por matrimonio civil', 'aprobada', 5, '2026-11-02 15:00:00', '2026-10-29 10:00:00'),
  (42, 'vacaciones', '2026-11-13', '2026-11-19', 5.00, 'Viaje familiar fuera del país previamente coordinado', 'aprobada', 1, '2026-10-28 09:45:00', '2026-10-22 11:30:00'),
  (9, 'vacaciones', '2026-12-07', '2026-12-11', 5.00, 'Vacaciones de cierre de año para reducir saldo >20 días', 'pendiente', 3, NULL, '2026-11-05 09:12:00'),
  (10, 'vacaciones', '2026-12-14', '2026-12-18', 5.00, 'Semana de descanso de diciembre', 'pendiente', 3, NULL, '2026-11-06 14:25:00'),
  (12, 'vacaciones', '2026-12-21', '2026-12-24', 4.00, 'Días previos a Navidad en Cartago', 'pendiente', 3, NULL, '2026-11-07 11:05:00'),
  (14, 'permiso_personal', '2026-11-26', '2026-11-26', 1.00, 'Examen universitario de maestría en horario diurno', 'pendiente', 3, NULL, '2026-11-09 08:40:00'),
  (19, 'vacaciones', '2026-11-30', '2026-12-04', 4.00, 'Descanso después de entrega de release Q4', 'pendiente', 3, NULL, '2026-11-10 10:15:00'),
  (27, 'vacaciones', '2026-12-07', '2026-12-11', 5.00, 'Vacaciones programadas para disminuir pasivo acumulado', 'pendiente', 4, NULL, '2026-11-10 16:00:00'),
  (31, 'permiso_personal', '2026-11-25', '2026-11-25', 1.00, 'Trámite de renovación de licencia de conducir en COSEVI', 'pendiente', 4, NULL, '2026-11-11 09:50:00'),
  (35, 'vacaciones', '2026-12-14', '2026-12-22', 7.00, 'Vacaciones de fin de año en familia', 'pendiente', 5, NULL, '2026-11-12 13:20:00'),
  (38, 'vacaciones', '2026-11-27', '2026-11-27', 1.00, 'Asistencia a graduación familiar en Heredia', 'pendiente', 5, NULL, '2026-11-13 08:15:00'),
  (41, 'vacaciones', '2026-12-02', '2026-12-04', 3.00, 'Puente posterior al feriado de Abolición del Ejército', 'pendiente', 1, NULL, '2026-11-13 15:45:00'),
  (6, 'vacaciones', '2026-09-07', '2026-09-09', 3.00, 'Descanso corto tras cierre de planilla agosto', 'aprobada', 2, '2026-08-26 10:00:00', '2026-08-24 09:30:00'),
  (13, 'vacaciones', '2026-09-14', '2026-09-14', 1.00, 'Puente previo al Día de la Independencia', 'aprobada', 3, '2026-09-08 11:10:00', '2026-09-07 15:00:00'),
  (15, 'permiso_fallecimiento', '2026-09-16', '2026-09-18', 3.00, 'Duelo por fallecimiento de familiar en primer grado', 'aprobada', 3, '2026-09-16 08:15:00', '2026-09-16 07:45:00'),
  (20, 'permiso_personal', '2026-09-21', '2026-09-21', 1.00, 'Cita de trámite hipotecario bancario', 'aprobada', 3, '2026-09-17 16:20:00', '2026-09-17 09:00:00'),
  (22, 'vacaciones', '2026-09-24', '2026-09-25', 2.00, 'Días de descanso en San Carlos', 'aprobada', 3, '2026-09-18 14:00:00', '2026-09-16 11:20:00'),
  (28, 'vacaciones', '2026-09-28', '2026-10-02', 5.00, 'Vacaciones anuales Q3', 'aprobada', 4, '2026-09-14 09:30:00', '2026-09-10 10:00:00'),
  (37, 'vacaciones', '2026-10-05', '2026-10-06', 2.00, 'Mudanza de domicilio en Escazú', 'aprobada', 5, '2026-09-29 15:40:00', '2026-09-28 13:10:00'),
  (7, 'permiso_personal', '2026-10-09', '2026-10-09', 1.00, 'Defensa de proyecto académico', 'aprobada', 2, '2026-10-05 10:15:00', '2026-10-02 16:00:00'),
  (17, 'vacaciones', '2026-10-12', '2026-10-16', 5.00, 'Semana de descanso de octubre', 'rechazada', 3, '2026-10-06 17:00:00', '2026-10-05 10:30:00'),
  (23, 'vacaciones', '2026-10-19', '2026-10-21', 3.00, 'Descanso personal en Limón', 'aprobada', 3, '2026-10-05 09:20:00', '2026-10-01 11:40:00'),
  (30, 'permiso_personal', '2026-10-22', '2026-10-22', 1.00, 'Trámite registral en el Registro Nacional', 'aprobada', 4, '2026-10-19 11:00:00', '2026-10-16 14:20:00'),
  (39, 'vacaciones', '2026-10-26', '2026-10-28', 3.00, 'Viaje corto a Monteverde', 'cancelada', 5, '2026-10-20 08:50:00', '2026-10-12 09:15:00'),
  (43, 'vacaciones', '2026-10-29', '2026-10-30', 2.00, 'Días libres fin de mes', 'aprobada', 1, '2026-10-23 14:30:00', '2026-10-21 10:05:00'),
  (18, 'vacaciones', '2026-11-02', '2026-11-03', 2.00, 'Asuntos familiares en Alajuela', 'aprobada', 3, '2026-10-28 16:10:00', '2026-10-26 08:55:00'),
  (21, 'licencia_sin_goce', '2026-11-04', '2026-11-06', 3.00, 'Asistencia a congreso internacional por cuenta propia', 'aprobada', 3, '2026-10-27 11:30:00', '2026-10-20 15:10:00'),
  (32, 'vacaciones', '2026-11-05', '2026-11-06', 2.00, 'Descanso personal', 'rechazada', 4, '2026-11-03 10:00:00', '2026-11-02 17:15:00'),
  (8, 'permiso_personal', '2026-11-09', '2026-11-09', 1.00, 'Cita consular para renovación de visa', 'aprobada', 2, '2026-11-04 09:00:00', '2026-11-02 10:45:00'),
  (44, 'vacaciones', '2026-11-11', '2026-11-13', 3.00, 'Vacaciones cortas post cierre contable octubre', 'aprobada', 1, '2026-10-29 12:00:00', '2026-10-26 16:30:00'),
  (24, 'vacaciones', '2026-12-03', '2026-12-04', 2.00, 'Vacaciones solicitadas con anticipación reglamentaria', 'pendiente', 3, NULL, '2026-11-15 11:00:00'),
  (33, 'permiso_personal', '2026-11-24', '2026-11-24', 1.00, 'Cita médica especialista privada', 'pendiente', 4, NULL, '2026-11-16 09:30:00');

-- 6. incapacidades (15 registros: CCSS e INS)
INSERT INTO incapacidades (colaborador_id, numero_boleta, tipo, fecha_inicio, fecha_fin, dias, entidad, porcentaje_subsidio) VALUES
  (14, 'CCSS-EDUS-2026-0901', 'enfermedad_comun', '2026-09-03', '2026-09-05', 3, 'CCSS', 50.00),
  (22, 'CCSS-EDUS-2026-0902', 'enfermedad_comun', '2026-09-08', '2026-09-12', 5, 'CCSS', 60.00),
  (31, 'INS-RT-2026-0903', 'riesgo_trabajo', '2026-09-14', '2026-09-21', 8, 'INS', 60.00),
  (40, 'CCSS-EDUS-2026-0904', 'enfermedad_comun', '2026-09-22', '2026-09-23', 2, 'CCSS', 50.00),
  (18, 'CCSS-EDUS-2026-0905', 'maternidad', '2026-09-25', '2026-12-23', 90, 'CCSS', 100.00),
  (7, 'CCSS-EDUS-2026-1001', 'enfermedad_comun', '2026-10-02', '2026-10-06', 5, 'CCSS', 60.00),
  (28, 'INS-RT-2026-1002', 'riesgo_trabajo', '2026-10-07', '2026-10-16', 10, 'INS', 60.00),
  (37, 'CCSS-EDUS-2026-1003', 'enfermedad_comun', '2026-10-13', '2026-10-15', 3, 'CCSS', 50.00),
  (19, 'CCSS-EDUS-2026-1004', 'enfermedad_comun', '2026-10-19', '2026-10-24', 6, 'CCSS', 60.00),
  (43, 'INS-RT-2026-1005', 'riesgo_trabajo', '2026-10-26', '2026-10-30', 5, 'INS', 60.00),
  (12, 'CCSS-EDUS-2026-1101', 'enfermedad_comun', '2026-11-02', '2026-11-04', 3, 'CCSS', 50.00),
  (24, 'CCSS-EDUS-2026-1102', 'enfermedad_comun', '2026-11-06', '2026-11-11', 6, 'CCSS', 60.00),
  (33, 'INS-RT-2026-1103', 'riesgo_trabajo', '2026-11-10', '2026-11-18', 9, 'INS', 60.00),
  (15, 'CCSS-EDUS-2026-1104', 'enfermedad_comun', '2026-11-14', '2026-11-17', 4, 'CCSS', 60.00),
  (44, 'CCSS-EDUS-2026-1105', 'enfermedad_comun', '2026-11-16', '2026-11-18', 3, 'CCSS', 50.00);

-- 7. movimientos_personal (60 registros)
INSERT INTO movimientos_personal (colaborador_id, tipo, puesto_anterior_id, puesto_nuevo_id, fecha, motivo) VALUES
  (33, 'traslado', 8, 8, '2026-09-01', 'Traslado interno a célula de automatización CloudOps'),
  (25, 'contratacion', NULL, 4, '2026-09-07', 'Contratación a plazo fijo para proyecto QA Q4'),
  (45, 'contratacion', NULL, 12, '2026-09-14', 'Ingreso por servicios profesionales área contable'),
  (34, 'contratacion', NULL, 8, '2026-09-21', 'Contratación Ingeniero DevOps y Cloud'),
  (26, 'contratacion', NULL, 3, '2026-10-05', 'Contratación Desarrollador Full Stack Mid'),
  (46, 'terminacion', 3, NULL, '2026-09-18', 'Renuncia voluntaria con preaviso de ley cumplido'),
  (47, 'terminacion', 4, NULL, '2026-09-30', 'Salida por traslado al extranjero; liquidación pagada'),
  (48, 'terminacion', 8, NULL, '2026-10-15', 'Despido con responsabilidad patronal y cesantía al día'),
  (49, 'terminacion', 10, NULL, '2026-10-30', 'Renuncia voluntaria por nueva oportunidad académica'),
  (50, 'terminacion', 12, NULL, '2026-11-06', 'Vencimiento natural de contrato a plazo fijo'),
  (15, 'ascenso', 3, 2, '2026-09-04', 'Promoción por desempeño sobresaliente a Senior'),
  (16, 'ascenso', 3, 2, '2026-09-11', 'Ascenso tras certificación cloud y liderazgo técnico'),
  (22, 'ascenso', 4, 3, '2026-09-25', 'Transición de carrera de QA Automation a Full Stack Mid'),
  (7, 'ascenso', 6, 6, '2026-10-01', 'Ampliación de responsabilidades en planillas y analítica'),
  (29, 'ascenso', 8, 8, '2026-10-08', 'Nombramiento como referente técnico de infraestructura'),
  (37, 'ascenso', 10, 10, '2026-10-12', 'Liderazgo de sistema de diseño corporativo'),
  (17, 'ascenso', 3, 2, '2026-10-19', 'Ascenso semestral por cumplimiento de OKRs'),
  (30, 'ascenso', 8, 8, '2026-10-26', 'Promoción interna por automatización de pipelines'),
  (42, 'ascenso', 12, 12, '2026-11-02', 'Ascenso a encargado de cierres contables y tributarios'),
  (19, 'ascenso', 3, 3, '2026-11-09', 'Promoción de banda salarial interna por mérito'),
  (9, 'ajuste_salarial', 2, 2, '2026-09-01', 'Ajuste salarial por revisión semestral de bandas y costo de vida'),
  (10, 'ajuste_salarial', 2, 2, '2026-09-02', 'Ajuste salarial por revisión semestral de bandas y costo de vida'),
  (11, 'ajuste_salarial', 2, 2, '2026-09-03', 'Ajuste salarial por revisión semestral de bandas y costo de vida'),
  (12, 'ajuste_salarial', 2, 2, '2026-09-04', 'Ajuste salarial por revisión semestral de bandas y costo de vida'),
  (13, 'ajuste_salarial', 2, 2, '2026-09-05', 'Ajuste salarial por revisión semestral de bandas y costo de vida'),
  (14, 'ajuste_salarial', 2, 2, '2026-09-06', 'Ajuste salarial por revisión semestral de bandas y costo de vida'),
  (15, 'ajuste_salarial', 3, 3, '2026-09-07', 'Ajuste salarial por revisión semestral de bandas y costo de vida'),
  (16, 'ajuste_salarial', 3, 3, '2026-10-08', 'Ajuste salarial por revisión semestral de bandas y costo de vida'),
  (17, 'ajuste_salarial', 3, 3, '2026-10-09', 'Ajuste salarial por revisión semestral de bandas y costo de vida'),
  (18, 'ajuste_salarial', 3, 3, '2026-10-10', 'Ajuste salarial por revisión semestral de bandas y costo de vida'),
  (19, 'ajuste_salarial', 3, 3, '2026-10-11', 'Ajuste salarial por revisión semestral de bandas y costo de vida'),
  (20, 'ajuste_salarial', 3, 3, '2026-10-12', 'Ajuste salarial por revisión semestral de bandas y costo de vida'),
  (21, 'ajuste_salarial', 3, 3, '2026-10-13', 'Ajuste salarial por revisión semestral de bandas y costo de vida'),
  (22, 'ajuste_salarial', 4, 4, '2026-10-14', 'Ajuste salarial por revisión semestral de bandas y costo de vida'),
  (23, 'ajuste_salarial', 4, 4, '2026-11-15', 'Ajuste salarial por revisión semestral de bandas y costo de vida'),
  (24, 'ajuste_salarial', 4, 4, '2026-11-01', 'Ajuste salarial por revisión semestral de bandas y costo de vida'),
  (25, 'ajuste_salarial', 4, 4, '2026-11-02', 'Ajuste salarial por revisión semestral de bandas y costo de vida'),
  (26, 'ajuste_salarial', 3, 3, '2026-11-03', 'Ajuste salarial por revisión semestral de bandas y costo de vida'),
  (27, 'ajuste_salarial', 8, 8, '2026-11-04', 'Ajuste salarial por revisión semestral de bandas y costo de vida'),
  (28, 'ajuste_salarial', 8, 8, '2026-11-05', 'Ajuste salarial por revisión semestral de bandas y costo de vida'),
  (21, 'cambio_modalidad', 3, 3, '2026-09-08', 'Actualización de adenda de teletrabajo según Ley 9738'),
  (22, 'cambio_modalidad', 4, 4, '2026-09-09', 'Actualización de adenda de teletrabajo según Ley 9738'),
  (23, 'cambio_modalidad', 4, 4, '2026-09-10', 'Actualización de adenda de teletrabajo según Ley 9738'),
  (24, 'cambio_modalidad', 4, 4, '2026-09-11', 'Actualización de adenda de teletrabajo según Ley 9738'),
  (25, 'cambio_modalidad', 4, 4, '2026-09-12', 'Actualización de adenda de teletrabajo según Ley 9738'),
  (26, 'cambio_modalidad', 3, 3, '2026-10-13', 'Actualización de adenda de teletrabajo según Ley 9738'),
  (27, 'cambio_modalidad', 8, 8, '2026-10-14', 'Actualización de adenda de teletrabajo según Ley 9738'),
  (28, 'cambio_modalidad', 8, 8, '2026-10-15', 'Actualización de adenda de teletrabajo según Ley 9738'),
  (29, 'cambio_modalidad', 8, 8, '2026-10-16', 'Actualización de adenda de teletrabajo según Ley 9738'),
  (30, 'cambio_modalidad', 8, 8, '2026-10-17', 'Actualización de adenda de teletrabajo según Ley 9738'),
  (31, 'cambio_modalidad', 8, 8, '2026-11-12', 'Actualización de adenda de teletrabajo según Ley 9738'),
  (32, 'cambio_modalidad', 8, 8, '2026-11-13', 'Actualización de adenda de teletrabajo según Ley 9738'),
  (33, 'cambio_modalidad', 8, 8, '2026-11-14', 'Actualización de adenda de teletrabajo según Ley 9738'),
  (34, 'cambio_modalidad', 8, 8, '2026-11-15', 'Actualización de adenda de teletrabajo según Ley 9738'),
  (35, 'cambio_modalidad', 10, 10, '2026-11-02', 'Actualización de adenda de teletrabajo según Ley 9738'),
  (23, 'traslado', 4, 3, '2026-09-22', 'Traslado a célula de desarrollo de plataforma interna'),
  (38, 'traslado', 10, 9, '2026-10-09', 'Traslado temporal como Product Owner de portal RRHH'),
  (18, 'traslado', 3, 3, '2026-10-16', 'Reasignación a equipo de integraciones API'),
  (31, 'traslado', 8, 8, '2026-11-03', 'Traslado a escuadrón de seguridad y cumplimiento'),
  (40, 'traslado', 9, 10, '2026-11-12', 'Apoyo multidisciplinario en investigación UX');

-- 8. feriados (12 feriados oficiales de Costa Rica 2026)
INSERT INTO feriados (fecha, nombre, tipo, se_traslada_a) VALUES
  ('2026-01-01', 'Año Nuevo', 'pago_obligatorio', NULL),
  ('2026-04-02', 'Jueves Santo', 'pago_obligatorio', NULL),
  ('2026-04-03', 'Viernes Santo', 'pago_obligatorio', NULL),
  ('2026-04-11', 'Día de Juan Santamaría', 'pago_obligatorio', NULL),
  ('2026-05-01', 'Día Internacional del Trabajo', 'pago_obligatorio', NULL),
  ('2026-07-25', 'Anexión del Partido de Nicoya', 'pago_obligatorio', NULL),
  ('2026-08-02', 'Día de la Virgen de los Ángeles', 'pago_no_obligatorio', NULL),
  ('2026-08-15', 'Día de la Madre', 'pago_obligatorio', NULL),
  ('2026-08-31', 'Día de la Persona Negra y la Cultura Afrocostarricense', 'pago_no_obligatorio', NULL),
  ('2026-09-15', 'Día de la Independencia', 'pago_obligatorio', NULL),
  ('2026-12-01', 'Día de la Abolición del Ejército', 'pago_no_obligatorio', NULL),
  ('2026-12-25', 'Navidad', 'pago_obligatorio', NULL);

-- 9. registro_asistencia (30 registros)
INSERT INTO registro_asistencia (colaborador_id, fecha, hora_entrada, hora_salida, modalidad_dia, tardia_minutos) VALUES
  (7, '2026-09-07', '08:15:00', '17:04:00', 'teletrabajo', 15),
  (8, '2026-09-14', '07:58:00', '17:04:00', 'presencial', 0),
  (9, '2026-09-21', '07:58:00', '17:04:00', 'teletrabajo', 0),
  (10, '2026-09-28', '07:58:00', '17:04:00', 'presencial', 0),
  (11, '2026-10-05', '07:58:00', '17:04:00', 'teletrabajo', 0),
  (12, '2026-10-12', '08:22:00', '17:04:00', 'presencial', 22),
  (13, '2026-10-19', '07:58:00', '17:04:00', 'teletrabajo', 0),
  (14, '2026-10-26', '08:08:00', '17:04:00', 'presencial', 8),
  (15, '2026-11-02', '07:58:00', '17:04:00', 'teletrabajo', 0),
  (16, '2026-11-09', '07:58:00', '17:04:00', 'presencial', 0),
  (17, '2026-11-16', '08:29:00', '17:04:00', 'teletrabajo', 29),
  (38, '2026-11-17', '07:58:00', NULL, 'presencial', 0),
  (19, '2026-09-07', '07:58:00', '17:04:00', 'teletrabajo', 0),
  (20, '2026-09-14', '07:58:00', '17:04:00', 'presencial', 0),
  (21, '2026-09-21', '08:08:00', '17:04:00', 'teletrabajo', 8),
  (22, '2026-09-28', '08:36:00', '17:04:00', 'presencial', 36),
  (23, '2026-10-05', '07:58:00', '17:04:00', 'teletrabajo', 0),
  (24, '2026-10-12', '07:58:00', '17:04:00', 'presencial', 0),
  (25, '2026-10-19', '07:58:00', '17:04:00', 'teletrabajo', 0),
  (26, '2026-10-26', '07:58:00', '17:04:00', 'presencial', 0),
  (27, '2026-11-02', '08:15:00', '17:04:00', 'teletrabajo', 15),
  (28, '2026-11-09', '08:08:00', '17:04:00', 'presencial', 8),
  (29, '2026-11-16', '07:58:00', '17:04:00', 'teletrabajo', 0),
  (30, '2026-11-17', '07:58:00', NULL, 'presencial', 0),
  (31, '2026-09-07', '07:58:00', '17:04:00', 'teletrabajo', 0),
  (32, '2026-09-14', '08:22:00', '17:04:00', 'presencial', 22),
  (33, '2026-09-21', '07:58:00', '17:04:00', 'teletrabajo', 0),
  (34, '2026-09-28', '07:58:00', '17:04:00', 'presencial', 0),
  (35, '2026-10-05', '08:08:00', '17:04:00', 'teletrabajo', 8),
  (36, '2026-10-12', '07:58:00', '17:04:00', 'presencial', 0);

-- 10. horas_extra (15 registros)
INSERT INTO horas_extra (colaborador_id, fecha, cantidad_horas, tipo_jornada, factor_pago, estado, aprobador_id) VALUES
  (9, '2026-09-05', 3.50, 'diurna', 1.50, 'pagada', 3),
  (10, '2026-09-10', 2.00, 'mixta', 1.50, 'pagada', 3),
  (27, '2026-09-15', 4.00, 'feriado_descanso', 2.00, 'pagada', 4),
  (28, '2026-09-15', 4.00, 'feriado_descanso', 2.00, 'pagada', 4),
  (15, '2026-09-24', 2.50, 'nocturna', 1.50, 'pagada', 3),
  (19, '2026-10-02', 3.00, 'diurna', 1.50, 'pagada', 3),
  (30, '2026-10-08', 3.50, 'nocturna', 1.50, 'pagada', 4),
  (41, '2026-10-14', 2.00, 'diurna', 1.50, 'pagada', 1),
  (12, '2026-10-21', 2.50, 'mixta', 1.50, 'pagada', 3),
  (31, '2026-10-28', 4.00, 'nocturna', 1.50, 'aprobada', 4),
  (23, '2026-11-03', 2.00, 'diurna', 1.50, 'aprobada', 3),
  (32, '2026-11-07', 3.00, 'diurna', 1.50, 'aprobada', 4),
  (42, '2026-11-11', 2.50, 'mixta', 1.50, 'pendiente', 1),
  (20, '2026-11-13', 3.00, 'nocturna', 1.50, 'pendiente', 3),
  (34, '2026-11-15', 2.50, 'feriado_descanso', 2.00, 'pendiente', 4);

-- 11. periodos_pago (3 periodos quincenales recientes)
INSERT INTO periodos_pago (id, codigo, fecha_inicio, fecha_fin, fecha_pago_programada, estado) VALUES
  (1, '2026-10-Q1', '2026-10-01', '2026-10-15', '2026-10-15', 'pagado'),
  (2, '2026-10-Q2', '2026-10-16', '2026-10-31', '2026-10-30', 'pagado'),
  (3, '2026-11-Q1', '2026-11-01', '2026-11-15', '2026-11-15', 'pagado');

-- 12. planillas (45 registros con deducción CCSS 10.67%, Renta progresiva CR y ASETEC)
INSERT INTO planillas (periodo_id, colaborador_id, salario_bruto, monto_horas_extra, deduccion_ccss, deduccion_renta, deduccion_asociacion, salario_neto) VALUES
  (1, 1, 1425000.00, 0.00, 152047.50, 145775.00, 71250.00, 1055927.50),
  (1, 2, 1300000.00, 0.00, 138710.00, 120775.00, 65000.00, 975515.00),
  (1, 3, 1650000.00, 0.00, 176055.00, 190775.00, 82500.00, 1200670.00),
  (1, 4, 1250000.00, 0.00, 133375.00, 110775.00, 62500.00, 943350.00),
  (1, 5, 1200000.00, 0.00, 128040.00, 100775.00, 60000.00, 911185.00),
  (1, 6, 725000.00, 0.00, 77357.50, 28850.00, 36250.00, 582542.50),
  (1, 7, 725000.00, 0.00, 77357.50, 28850.00, 36250.00, 582542.50),
  (1, 8, 725000.00, 0.00, 77357.50, 28850.00, 36250.00, 582542.50),
  (1, 9, 1150000.00, 0.00, 122705.00, 92600.00, 57500.00, 877195.00),
  (1, 10, 1150000.00, 0.00, 122705.00, 92600.00, 57500.00, 877195.00),
  (1, 12, 1150000.00, 43125.00, 127306.44, 99400.00, 59656.25, 906762.31),
  (1, 15, 787500.00, 0.00, 84026.25, 38225.00, 39375.00, 625873.75),
  (1, 27, 1050000.00, 0.00, 112035.00, 77600.00, 0.00, 860365.00),
  (1, 35, 875000.00, 0.00, 93362.50, 51350.00, 0.00, 730287.50),
  (1, 41, 587500.00, 22031.25, 65036.98, 14853.13, 0.00, 529641.14),
  (2, 1, 1425000.00, 0.00, 152047.50, 145775.00, 71250.00, 1055927.50),
  (2, 2, 1300000.00, 0.00, 138710.00, 120775.00, 65000.00, 975515.00),
  (2, 3, 1650000.00, 0.00, 176055.00, 190775.00, 82500.00, 1200670.00),
  (2, 4, 1250000.00, 0.00, 133375.00, 110775.00, 62500.00, 943350.00),
  (2, 5, 1200000.00, 0.00, 128040.00, 100775.00, 60000.00, 911185.00),
  (2, 6, 725000.00, 0.00, 77357.50, 28850.00, 36250.00, 582542.50),
  (2, 7, 725000.00, 0.00, 77357.50, 28850.00, 36250.00, 582542.50),
  (2, 8, 725000.00, 0.00, 77357.50, 28850.00, 36250.00, 582542.50),
  (2, 9, 1150000.00, 0.00, 122705.00, 92600.00, 57500.00, 877195.00),
  (2, 10, 1150000.00, 0.00, 122705.00, 92600.00, 57500.00, 877195.00),
  (2, 12, 1150000.00, 0.00, 122705.00, 92600.00, 57500.00, 877195.00),
  (2, 15, 787500.00, 29531.25, 87177.23, 42654.69, 40851.56, 646347.77),
  (2, 27, 1050000.00, 0.00, 112035.00, 77600.00, 0.00, 860365.00),
  (2, 35, 875000.00, 0.00, 93362.50, 51350.00, 0.00, 730287.50),
  (2, 41, 587500.00, 0.00, 62686.25, 12650.00, 0.00, 512163.75),
  (3, 1, 1425000.00, 0.00, 152047.50, 145775.00, 71250.00, 1055927.50),
  (3, 2, 1300000.00, 0.00, 138710.00, 120775.00, 65000.00, 975515.00),
  (3, 3, 1650000.00, 0.00, 176055.00, 190775.00, 82500.00, 1200670.00),
  (3, 4, 1250000.00, 0.00, 133375.00, 110775.00, 62500.00, 943350.00),
  (3, 5, 1200000.00, 0.00, 128040.00, 100775.00, 60000.00, 911185.00),
  (3, 6, 725000.00, 0.00, 77357.50, 28850.00, 36250.00, 582542.50),
  (3, 7, 725000.00, 0.00, 77357.50, 28850.00, 36250.00, 582542.50),
  (3, 8, 725000.00, 0.00, 77357.50, 28850.00, 36250.00, 582542.50),
  (3, 9, 1150000.00, 0.00, 122705.00, 92600.00, 57500.00, 877195.00),
  (3, 10, 1150000.00, 43125.00, 127306.44, 99400.00, 59656.25, 906762.31),
  (3, 12, 1150000.00, 0.00, 122705.00, 92600.00, 57500.00, 877195.00),
  (3, 15, 787500.00, 0.00, 84026.25, 38225.00, 39375.00, 625873.75),
  (3, 27, 1050000.00, 0.00, 112035.00, 77600.00, 0.00, 860365.00),
  (3, 35, 875000.00, 0.00, 93362.50, 51350.00, 0.00, 730287.50),
  (3, 41, 587500.00, 0.00, 62686.25, 12650.00, 0.00, 512163.75);

-- 13. beneficios (5 registros)
INSERT INTO beneficios (id, nombre, proveedor, aporte_empresa_pct, requiere_periodo_prueba) VALUES
  (1, 'Seguro Médico y Dental Colectivo', 'Pan-American Life CR', 80.00, TRUE),
  (2, 'Asociación Solidarista TicoTech (ASETEC)', 'ASETEC Costa Rica', 5.00, FALSE),
  (3, 'Presupuesto Anual de Certificaciones ($600 USD)', 'TicoTech Learning', 100.00, TRUE),
  (4, 'Bono Mensual de Conectividad Teletrabajo', 'TicoTech Solutions S.A.', 100.00, FALSE),
  (5, 'Programa de Bienestar y Gimnasio', 'Wellhub / SmartFit CR', 50.00, TRUE);

-- 14. colaborador_beneficios (40 afiliaciones)
INSERT INTO colaborador_beneficios (colaborador_id, beneficio_id, fecha_afiliacion, estado, beneficiarios_extra) VALUES
  (1, 2, '2025-01-15', 'activo', 0),
  (2, 2, '2025-01-15', 'activo', 0),
  (3, 2, '2025-01-15', 'activo', 0),
  (4, 2, '2025-01-15', 'activo', 0),
  (5, 2, '2025-01-15', 'activo', 0),
  (6, 2, '2025-01-15', 'activo', 0),
  (7, 2, '2025-01-15', 'activo', 0),
  (8, 2, '2025-01-15', 'activo', 0),
  (9, 2, '2025-01-15', 'activo', 0),
  (10, 2, '2025-01-15', 'activo', 0),
  (11, 2, '2025-01-15', 'activo', 0),
  (12, 2, '2025-01-15', 'activo', 0),
  (13, 2, '2025-01-15', 'activo', 0),
  (14, 2, '2025-01-15', 'activo', 0),
  (15, 2, '2025-01-15', 'activo', 0),
  (1, 1, '2025-02-01', 'activo', 1),
  (2, 1, '2025-02-01', 'activo', 2),
  (3, 1, '2025-02-01', 'activo', 0),
  (4, 1, '2025-02-01', 'activo', 1),
  (5, 1, '2025-02-01', 'activo', 2),
  (6, 1, '2025-02-01', 'activo', 0),
  (7, 1, '2025-02-01', 'activo', 1),
  (8, 1, '2025-02-01', 'activo', 2),
  (9, 1, '2025-02-01', 'activo', 0),
  (10, 1, '2025-02-01', 'activo', 1),
  (11, 3, '2026-01-10', 'activo', 0),
  (12, 3, '2026-01-10', 'activo', 0),
  (13, 3, '2026-01-10', 'activo', 0),
  (14, 3, '2026-01-10', 'activo', 0),
  (15, 3, '2026-01-10', 'activo', 0),
  (16, 3, '2026-01-10', 'activo', 0),
  (17, 4, '2026-03-01', 'activo', 0),
  (18, 4, '2026-03-01', 'activo', 0),
  (19, 4, '2026-03-01', 'activo', 0),
  (20, 4, '2026-03-01', 'activo', 0),
  (21, 4, '2026-03-01', 'activo', 0),
  (16, 5, '2026-06-01', 'activo', 1),
  (22, 5, '2026-06-01', 'activo', 1),
  (23, 5, '2026-06-01', 'activo', 1),
  (24, 5, '2026-06-01', 'activo', 1);

-- 15. evaluaciones_desempeno (25 registros)
INSERT INTO evaluaciones_desempeno (colaborador_id, evaluador_id, periodo, fecha_programada, fecha_completada, calificacion, plan_mejora, comentarios) VALUES
  (6, 2, '2026-S2', '2026-09-10', '2026-09-10', 3.65, FALSE, 'Cumplimiento sólido de OKRs y competencias técnicas durante el semestre.'),
  (7, 2, '2026-S2', '2026-09-11', '2026-09-11', 4.35, FALSE, 'Cumplimiento sólido de OKRs y competencias técnicas durante el semestre.'),
  (8, 2, '2026-S2', '2026-09-12', '2026-09-12', 3.75, FALSE, 'Cumplimiento sólido de OKRs y competencias técnicas durante el semestre.'),
  (9, 3, '2026-S2', '2026-09-13', '2026-09-13', 4.45, FALSE, 'Cumplimiento sólido de OKRs y competencias técnicas durante el semestre.'),
  (10, 3, '2026-S2', '2026-09-14', '2026-09-14', 2.65, TRUE, 'Se asigna Plan de Mejora de Desempeño (PIP) a 60 días con seguimiento quincenal.'),
  (11, 3, '2026-S2', '2026-09-15', '2026-09-15', 4.55, FALSE, 'Cumplimiento sólido de OKRs y competencias técnicas durante el semestre.'),
  (12, 3, '2026-S2', '2026-09-16', '2026-09-16', 3.95, FALSE, 'Cumplimiento sólido de OKRs y competencias técnicas durante el semestre.'),
  (13, 3, '2026-S2', '2026-09-17', '2026-09-17', 4.65, FALSE, 'Cumplimiento sólido de OKRs y competencias técnicas durante el semestre.'),
  (14, 3, '2026-S2', '2026-09-18', '2026-09-18', 4.05, FALSE, 'Cumplimiento sólido de OKRs y competencias técnicas durante el semestre.'),
  (15, 3, '2026-S2', '2026-09-19', '2026-09-19', 4.75, FALSE, 'Cumplimiento sólido de OKRs y competencias técnicas durante el semestre.'),
  (16, 3, '2026-S2', '2026-10-20', '2026-10-20', 4.15, FALSE, 'Cumplimiento sólido de OKRs y competencias técnicas durante el semestre.'),
  (17, 3, '2026-S2', '2026-10-21', '2026-10-21', 4.85, FALSE, 'Cumplimiento sólido de OKRs y competencias técnicas durante el semestre.'),
  (18, 3, '2026-S2', '2026-10-22', '2026-10-22', 4.25, FALSE, 'Cumplimiento sólido de OKRs y competencias técnicas durante el semestre.'),
  (19, 3, '2026-S2', '2026-10-23', '2026-10-23', 3.65, FALSE, 'Cumplimiento sólido de OKRs y competencias técnicas durante el semestre.'),
  (20, 3, '2026-S2', '2026-10-24', '2026-10-24', 2.65, TRUE, 'Se asigna Plan de Mejora de Desempeño (PIP) a 60 días con seguimiento quincenal.'),
  (21, 3, '2026-S2', '2026-10-10', '2026-10-10', 3.75, FALSE, 'Cumplimiento sólido de OKRs y competencias técnicas durante el semestre.'),
  (22, 3, '2026-S2', '2026-10-11', '2026-10-11', 4.45, FALSE, 'Cumplimiento sólido de OKRs y competencias técnicas durante el semestre.'),
  (23, 3, '2026-S2', '2026-10-12', '2026-10-12', 3.85, FALSE, 'Cumplimiento sólido de OKRs y competencias técnicas durante el semestre.'),
  (24, 3, '2026-S2', '2026-10-13', '2026-10-13', 4.55, FALSE, 'Cumplimiento sólido de OKRs y competencias técnicas durante el semestre.'),
  (25, 3, '2026-S2', '2026-10-14', '2026-10-14', 3.95, FALSE, 'Cumplimiento sólido de OKRs y competencias técnicas durante el semestre.'),
  (26, 3, '2026-S2', '2026-11-15', '2026-11-15', 4.65, FALSE, 'Cumplimiento sólido de OKRs y competencias técnicas durante el semestre.'),
  (27, 4, '2026-S2', '2026-11-16', '2026-11-16', 2.65, TRUE, 'Se asigna Plan de Mejora de Desempeño (PIP) a 60 días con seguimiento quincenal.'),
  (28, 4, '2026-S2', '2026-11-17', '2026-11-17', 4.75, FALSE, 'Cumplimiento sólido de OKRs y competencias técnicas durante el semestre.'),
  (29, 4, '2026-S2', '2026-11-18', NULL, NULL, FALSE, 'Evaluación semestral programada pendiente de sesión de retroalimentación.'),
  (30, 4, '2026-S2', '2026-11-19', NULL, NULL, FALSE, 'Evaluación semestral programada pendiente de sesión de retroalimentación.');

-- 16. capacitaciones (4 registros)
INSERT INTO capacitaciones (id, titulo, categoria, horas_duracion, fecha_inicio, cupos) VALUES
  (1, 'Arquitectura Cloud Segura en AWS y Kubernetes', 'Tecnología', 24, '2026-09-14', 15),
  (2, 'Ley 8968: Protección de Datos Personales en Sistemas de Software', 'Cumplimiento Legal', 8, '2026-10-06', 25),
  (3, 'Prevención del Hostigamiento Laboral y Sexual (Ley 7476)', 'Cultura y Ética', 6, '2026-10-22', 30),
  (4, 'Liderazgo Técnico y Gestión por OKRs para Equipos Ágiles', 'Liderazgo', 16, '2026-11-10', 12);

-- 17. capacitaciones_inscripciones (20 registros)
INSERT INTO capacitaciones_inscripciones (capacitacion_id, colaborador_id, estado, nota_final) VALUES
  (1, 6, 'completado', 86.00),
  (2, 7, 'completado', 87.00),
  (3, 8, 'completado', 88.00),
  (4, 9, 'en_curso', NULL),
  (1, 10, 'completado', 90.00),
  (2, 11, 'completado', 91.00),
  (3, 12, 'completado', 92.00),
  (4, 13, 'inscrito', NULL),
  (1, 14, 'completado', 94.00),
  (2, 15, 'completado', 95.00),
  (3, 16, 'completado', 96.00),
  (4, 17, 'en_curso', NULL),
  (1, 18, 'completado', 98.00),
  (2, 19, 'completado', 99.00),
  (3, 20, 'completado', 86.00),
  (4, 21, 'inscrito', NULL),
  (1, 22, 'completado', 88.00),
  (2, 23, 'completado', 89.00),
  (3, 24, 'completado', 90.00),
  (4, 25, 'en_curso', NULL);

-- 18. denuncias_etica (3 registros)
INSERT INTO denuncias_etica (codigo_seguimiento, reportante_id, categoria, descripcion, estado, fecha_creacion) VALUES
  ('ETH-2026-0901', NULL, 'acoso_laboral', 'Reporte anónimo sobre tono inapropiado y sobrecarga reiterada de tareas fuera de jornada en célula de soporte.', 'resuelta', '2026-09-18 14:20:00'),
  ('ETH-2026-1002', 22, 'privacidad_datos', 'Consulta por compartición accidental de hoja de cálculo con incapacidades en carpeta compartida sin restricción de acceso.', 'en_investigacion', '2026-10-21 10:05:00'),
  ('ETH-2026-1103', NULL, 'conflicto_interes', 'Alerta anónima sobre posible vínculo familiar no declarado con proveedor externo en evaluación de licitación.', 'recibida', '2026-11-12 16:45:00');

-- 19. documentos_politicas (10 documentos oficiales de Google Drive)
INSERT INTO documentos_politicas (drive_file_id, titulo, version, fecha_vigencia, responsable, url_drive, ultima_sincronizacion, total_chunks) VALUES
  ('1drv_tt_pol_01_vacaciones_2026', 'Documento 1 - Política de Vacaciones y Calendario de Feriados Oficiales', '2.1', '2026-01-01', 'Dirección de Talento Humano – TicoTech Solutions S.A.', 'https://drive.google.com/file/d/1drv_tt_pol_01_vacaciones_2026/view', '2026-11-17 07:00:12', 14),
  ('1drv_tt_pol_02_permisos_2026', 'Documento 2 - Política de Permisos y Licencias Especiales', '1.4', '2026-01-01', 'Dirección de Talento Humano – TicoTech Solutions S.A.', 'https://drive.google.com/file/d/1drv_tt_pol_02_permisos_2026/view', '2026-11-17 07:00:14', 11),
  ('1drv_tt_pol_03_incapacidades_2026', 'Documento 3 - Protocolo de Gestión de Incapacidades CCSS e INS', '2.0', '2026-02-01', 'Dirección de Talento Humano – TicoTech Solutions S.A.', 'https://drive.google.com/file/d/1drv_tt_pol_03_incapacidades_2026/view', '2026-11-17 07:00:16', 13),
  ('1drv_tt_pol_04_teletrabajo_2026', 'Documento 4 - Reglamento de Jornada Laboral, Asistencia y Teletrabajo', '3.0', '2026-01-15', 'Dirección de Talento Humano – TicoTech Solutions S.A.', 'https://drive.google.com/file/d/1drv_tt_pol_04_teletrabajo_2026/view', '2026-11-17 07:00:18', 18),
  ('1drv_tt_pol_05_remuneracion_2026', 'Documento 5 - Política de Remuneración, Planilla y Aguinaldo', '1.5', '2026-01-01', 'Dirección de Talento Humano y Finanzas – TicoTech Solutions S.A.', 'https://drive.google.com/file/d/1drv_tt_pol_05_remuneracion_2026/view', '2026-11-17 07:00:20', 16),
  ('1drv_tt_pol_06_beneficios_2026', 'Documento 6 - Guía de Beneficios Corporativos y Asociación Solidarista', '2.2', '2026-03-01', 'Dirección de Talento Humano – TicoTech Solutions S.A.', 'https://drive.google.com/file/d/1drv_tt_pol_06_beneficios_2026/view', '2026-11-17 07:00:22', 12),
  ('1drv_tt_pol_07_onboarding_salida_2026', 'Documento 7 - Manual de Onboarding, Periodo de Prueba y Salida', '1.3', '2026-01-01', 'Dirección de Talento Humano – TicoTech Solutions S.A.', 'https://drive.google.com/file/d/1drv_tt_pol_07_onboarding_salida_2026/view', '2026-11-17 07:00:24', 15),
  ('1drv_tt_pol_08_desempeno_pip_2026', 'Documento 8 - Modelo de Evaluación de Desempeño y Plan de Mejora (PIP)', '1.8', '2026-04-01', 'Dirección de Talento Humano – TicoTech Solutions S.A.', 'https://drive.google.com/file/d/1drv_tt_pol_08_desempeno_pip_2026/view', '2026-11-17 07:00:26', 14),
  ('1drv_tt_pol_09_conducta_acoso_2026', 'Documento 9 - Código de Conducta y Prevención del Hostigamiento (Ley 7476)', '2.4', '2026-01-01', 'Comité de Ética y Talento Humano – TicoTech Solutions S.A.', 'https://drive.google.com/file/d/1drv_tt_pol_09_conducta_acoso_2026/view', '2026-11-17 07:00:28', 19),
  ('1drv_tt_pol_10_privacidad_datos_2026', 'Documento 10 - Política de Protección de Datos Personales (Ley 8968)', '2.0', '2026-01-01', 'Oficialía de Cumplimiento y RRHH – TicoTech Solutions S.A.', 'https://drive.google.com/file/d/1drv_tt_pol_10_privacidad_datos_2026/view', '2026-11-17 07:00:30', 17);

-- 20. consultas_chat (40 registros)
INSERT INTO consultas_chat (id, colaborador_id, sesion_id, pregunta, intencion, agente_utilizado, documentos_citados, confianza_rag, resuelta, escalada, latencia_ms, fecha) VALUES
  (1, 9, 'sess-2026-001', '¿Cuántos días de vacaciones se acumulan por mes en TicoTech?', 'politicas_rrhh', 'politicasAgent', '["Documento 1 - Política de Vacaciones y Calendario de Feriados Oficiales"]', 0.942, TRUE, FALSE, 815, '2026-09-03 09:07:00'),
  (2, 12, 'sess-2026-002', '¿Cuántos días disponibles de vacaciones tengo en este periodo?', 'datos_personales', 'datosAgent', '[]', NULL, TRUE, FALSE, 490, '2026-09-04 10:14:00'),
  (3, 15, 'sess-2026-003', '¿Cuál fue mi salario neto en la última quincena pagada?', 'datos_personales', 'datosAgent', '[]', NULL, TRUE, FALSE, 495, '2026-09-05 11:21:00'),
  (4, 18, 'sess-2026-004', '¿Cuánto gana mi compañero Alejandro Vargas?', 'privacidad_rechazada', 'orquestador', '["Documento 10 - Política de Protección de Datos Personales (Ley 8968)"]', 0.985, TRUE, FALSE, 350, '2026-09-06 12:28:00'),
  (5, 21, 'sess-2026-005', '¿Cuántos días paga el patrono y la CCSS por incapacidad común?', 'politicas_rrhh', 'politicasAgent', '["Documento 3 - Protocolo de Gestión de Incapacidades CCSS e INS"]', 0.915, TRUE, FALSE, 810, '2026-09-07 13:35:00'),
  (6, 6, 'sess-2026-006', '¿Cuál es el promedio de días disponibles de vacaciones por departamento?', 'analitica_rrhh', 'analistaAgent', '[]', NULL, TRUE, FALSE, 1155, '2026-09-08 14:42:00'),
  (7, 27, 'sess-2026-007', '¿Cómo solicito la licencia de paternidad de 10 días?', 'politicas_rrhh', 'politicasAgent', '["Documento 2 - Política de Permisos y Licencias Especiales"]', 0.931, TRUE, FALSE, 815, '2026-09-09 15:49:00'),
  (8, 30, 'sess-2026-008', '¿Cuándo se deposita el aguinaldo en TicoTech?', 'politicas_rrhh', 'politicasAgent', '["Documento 5 - Política de Remuneración, Planilla y Aguinaldo"]', 0.958, TRUE, FALSE, 795, '2026-09-10 16:56:00'),
  (9, 33, 'sess-2026-009', 'Necesito el estado de mi última solicitud de vacaciones', 'datos_personales', 'datosAgent', '[]', NULL, TRUE, FALSE, 520, '2026-09-11 08:04:00'),
  (10, 2, 'sess-2026-010', '¿Cuántas solicitudes de vacaciones pendientes tienen más de 3 días?', 'analitica_rrhh', 'analistaAgent', '[]', NULL, TRUE, FALSE, 990, '2026-09-12 09:11:00'),
  (11, 39, 'sess-2026-011', '¿Cuántos días de vacaciones se acumulan por mes en TicoTech?', 'politicas_rrhh', 'politicasAgent', '["Documento 1 - Política de Vacaciones y Calendario de Feriados Oficiales"]', 0.942, TRUE, FALSE, 815, '2026-10-13 10:18:00'),
  (12, 42, 'sess-2026-012', '¿Cuántos días disponibles de vacaciones tengo en este periodo?', 'datos_personales', 'datosAgent', '[]', NULL, TRUE, FALSE, 490, '2026-10-14 11:25:00'),
  (13, 6, 'sess-2026-013', '¿Cuál fue mi salario neto en la última quincena pagada?', 'datos_personales', 'datosAgent', '[]', NULL, TRUE, FALSE, 495, '2026-10-15 12:32:00'),
  (14, 9, 'sess-2026-014', '¿Cuánto gana mi compañero Alejandro Vargas?', 'privacidad_rechazada', 'orquestador', '["Documento 10 - Política de Protección de Datos Personales (Ley 8968)"]', 0.985, TRUE, FALSE, 350, '2026-10-16 13:39:00'),
  (15, 12, 'sess-2026-015', '¿Cuántos días paga el patrono y la CCSS por incapacidad común?', 'politicas_rrhh', 'politicasAgent', '["Documento 3 - Protocolo de Gestión de Incapacidades CCSS e INS"]', 0.915, TRUE, FALSE, 810, '2026-10-17 14:46:00'),
  (16, 6, 'sess-2026-016', '¿Cuál es el promedio de días disponibles de vacaciones por departamento?', 'analitica_rrhh', 'analistaAgent', '[]', NULL, TRUE, FALSE, 1155, '2026-10-18 15:53:00'),
  (17, 18, 'sess-2026-017', '¿Cómo solicito la licencia de paternidad de 10 días?', 'politicas_rrhh', 'politicasAgent', '["Documento 2 - Política de Permisos y Licencias Especiales"]', 0.931, TRUE, FALSE, 815, '2026-10-19 16:01:00'),
  (18, 21, 'sess-2026-018', '¿Cuándo se deposita el aguinaldo en TicoTech?', 'politicas_rrhh', 'politicasAgent', '["Documento 5 - Política de Remuneración, Planilla y Aguinaldo"]', 0.958, TRUE, FALSE, 795, '2026-10-20 08:08:00'),
  (19, 24, 'sess-2026-019', 'Necesito el estado de mi última solicitud de vacaciones', 'datos_personales', 'datosAgent', '[]', NULL, TRUE, FALSE, 520, '2026-10-21 09:15:00'),
  (20, 2, 'sess-2026-020', '¿Cuántas solicitudes de vacaciones pendientes tienen más de 3 días?', 'analitica_rrhh', 'analistaAgent', '[]', NULL, TRUE, FALSE, 990, '2026-10-22 10:22:00'),
  (21, 30, 'sess-2026-021', '¿Cuántos días de vacaciones se acumulan por mes en TicoTech?', 'politicas_rrhh', 'politicasAgent', '["Documento 1 - Política de Vacaciones y Calendario de Feriados Oficiales"]', 0.942, TRUE, FALSE, 815, '2026-10-23 11:29:00'),
  (22, 33, 'sess-2026-022', '¿Cuántos días disponibles de vacaciones tengo en este periodo?', 'datos_personales', 'datosAgent', '[]', NULL, TRUE, FALSE, 490, '2026-10-24 12:36:00'),
  (23, 36, 'sess-2026-023', '¿Cuál fue mi salario neto en la última quincena pagada?', 'datos_personales', 'datosAgent', '[]', NULL, TRUE, FALSE, 495, '2026-10-25 13:43:00'),
  (24, 39, 'sess-2026-024', '¿Cuánto gana mi compañero Alejandro Vargas?', 'privacidad_rechazada', 'orquestador', '["Documento 10 - Política de Protección de Datos Personales (Ley 8968)"]', 0.985, TRUE, FALSE, 350, '2026-10-26 14:50:00'),
  (25, 42, 'sess-2026-025', '¿Cuántos días paga el patrono y la CCSS por incapacidad común?', 'politicas_rrhh', 'politicasAgent', '["Documento 3 - Protocolo de Gestión de Incapacidades CCSS e INS"]', 0.915, TRUE, FALSE, 810, '2026-11-10 15:57:00'),
  (26, 6, 'sess-2026-026', '¿Cuál es el promedio de días disponibles de vacaciones por departamento?', 'analitica_rrhh', 'analistaAgent', '[]', NULL, TRUE, FALSE, 1155, '2026-11-11 16:05:00'),
  (27, 9, 'sess-2026-027', '¿Cómo solicito la licencia de paternidad de 10 días?', 'politicas_rrhh', 'politicasAgent', '["Documento 2 - Política de Permisos y Licencias Especiales"]', 0.931, TRUE, FALSE, 815, '2026-11-12 08:12:00'),
  (28, 12, 'sess-2026-028', '¿Cuándo se deposita el aguinaldo en TicoTech?', 'politicas_rrhh', 'politicasAgent', '["Documento 5 - Política de Remuneración, Planilla y Aguinaldo"]', 0.958, TRUE, FALSE, 795, '2026-11-13 09:19:00'),
  (29, 15, 'sess-2026-029', 'Necesito el estado de mi última solicitud de vacaciones', 'datos_personales', 'datosAgent', '[]', NULL, TRUE, FALSE, 520, '2026-11-14 10:26:00'),
  (30, 2, 'sess-2026-030', '¿Cuántas solicitudes de vacaciones pendientes tienen más de 3 días?', 'analitica_rrhh', 'analistaAgent', '[]', NULL, TRUE, FALSE, 990, '2026-11-15 11:33:00'),
  (31, 21, 'sess-2026-031', '¿Cuántos días de vacaciones se acumulan por mes en TicoTech?', 'politicas_rrhh', 'politicasAgent', '["Documento 1 - Política de Vacaciones y Calendario de Feriados Oficiales"]', 0.942, TRUE, FALSE, 815, '2026-11-16 12:40:00'),
  (32, 24, 'sess-2026-032', '¿Cuántos días disponibles de vacaciones tengo en este periodo?', 'datos_personales', 'datosAgent', '[]', NULL, TRUE, FALSE, 490, '2026-11-01 13:47:00'),
  (33, 27, 'sess-2026-033', '¿Cuál fue mi salario neto en la última quincena pagada?', 'datos_personales', 'datosAgent', '[]', NULL, TRUE, FALSE, 495, '2026-11-02 14:54:00'),
  (34, 30, 'sess-2026-034', '¿Cuánto gana mi compañero Alejandro Vargas?', 'privacidad_rechazada', 'orquestador', '["Documento 10 - Política de Protección de Datos Personales (Ley 8968)"]', 0.985, TRUE, FALSE, 350, '2026-11-03 15:02:00'),
  (35, 14, 'sess-2026-035', 'Mi boleta EDUS de incapacidad tiene un error en el monto subsidiado de la quincena, necesito revisión manual.', 'escalamiento_humano', 'orquestador', '[]', NULL, FALSE, TRUE, 540, '2026-11-14 10:20:00'),
  (36, 21, 'sess-2026-036', 'Requiero constancia salarial firmada digitalmente con desglose de horas extra para trámite bancario urgente.', 'escalamiento_humano', 'orquestador', '[]', NULL, FALSE, TRUE, 540, '2026-11-14 15:40:00'),
  (37, 29, 'sess-2026-037', 'Quiero incluir a mi cónyuge e hijo en el seguro médico colectivo pero el sistema no me muestra el formulario.', 'escalamiento_humano', 'orquestador', '[]', NULL, FALSE, TRUE, 540, '2026-11-15 09:15:00'),
  (38, 33, 'sess-2026-038', 'Tuve un accidente menor en trayecto laboral y necesito instrucciones directas para la apertura de caso INS.', 'escalamiento_humano', 'orquestador', '[]', NULL, FALSE, TRUE, 540, '2026-11-16 08:30:00'),
  (39, 38, 'sess-2026-039', 'Tengo dudas sobre los criterios de mi Plan de Mejora (PIP) y quiero agendar una mediación con Talento Humano.', 'escalamiento_humano', 'orquestador', '[]', NULL, FALSE, TRUE, 540, '2026-11-16 14:50:00'),
  (40, 44, 'sess-2026-040', 'No aparece mi deducción de ASETEC aplicada correctamente en el comprobante del 15 de noviembre.', 'escalamiento_humano', 'orquestador', '[]', NULL, FALSE, TRUE, 540, '2026-11-17 08:45:00');

-- 21. tickets_escalamiento (6 tickets abiertos)
INSERT INTO tickets_escalamiento (consulta_id, colaborador_id, asignado_rrhh_id, asunto, prioridad, estado, respuesta_rrhh, creado_en) VALUES
  (35, 14, 6, 'Discrepancia en cálculo de subsidio incapacidad CCSS', 'alta', 'abierto', NULL, '2026-11-14 10:20:00'),
  (36, 21, 7, 'Solicitud de constancia salarial certificada para banco', 'media', 'abierto', NULL, '2026-11-14 15:40:00'),
  (37, 29, 8, 'Inclusión de dependientes en Seguro Médico Colectivo', 'media', 'abierto', NULL, '2026-11-15 09:15:00'),
  (38, 33, 6, 'Asistencia urgente para apertura de boleta de riesgo laboral INS', 'urgente', 'abierto', NULL, '2026-11-16 08:30:00'),
  (39, 38, 2, 'Solicitud de mediación RRHH sobre Plan de Mejora (PIP)', 'alta', 'abierto', NULL, '2026-11-16 14:50:00'),
  (40, 44, 7, 'Revisión de rebajo Asociación Solidarista en planilla 2026-11-Q1', 'alta', 'abierto', NULL, '2026-11-17 08:45:00');

-- 22. reportes_diarios (3 reportes históricos)
INSERT INTO reportes_diarios (fecha, datos_json, resumen_texto, generado_por, creado_en) VALUES
  ('2026-11-14', '{"colaboradores_activos":45,"ausencias_activas":4,"solicitudes_pendientes_mas_3_dias":10,"pasivo_vacaciones_mayor_20_dias":9,"tickets_abiertos":2,"consultas_chat_dia":12}', 'Reporte diario 2026-11-14: 45 colaboradores activos, 9 colaboradores superan los 20 días de vacaciones acumuladas (alerta de pasivo laboral) y 10 solicitudes pendientes exceden las 72 horas sin resolución.', 'cronJobs_analistaAgent', '2026-11-14 07:00:05'),
  ('2026-11-15', '{"colaboradores_activos":45,"ausencias_activas":5,"solicitudes_pendientes_mas_3_dias":10,"pasivo_vacaciones_mayor_20_dias":9,"tickets_abiertos":3,"consultas_chat_dia":9,"planilla_cerrada":"2026-11-Q1"}', 'Reporte diario 2026-11-15: Cierre exitoso de planilla 2026-11-Q1 con retención CCSS del 10.67%. Se mantienen 9 alertas de exceso de vacaciones y 3 tickets de escalamiento abiertos.', 'cronJobs_analistaAgent', '2026-11-15 07:00:04'),
  ('2026-11-16', '{"colaboradores_activos":45,"ausencias_activas":7,"solicitudes_pendientes_mas_3_dias":10,"pasivo_vacaciones_mayor_20_dias":9,"tickets_abiertos":5,"consultas_chat_dia":15}', 'Reporte diario 2026-11-16: 7 ausencias activas (permisos e incapacidades CCSS/INS), 10 solicitudes pendientes con antigüedad > 3 días y 5 tickets de escalamiento pendientes de atención por RRHH.', 'cronJobs_analistaAgent', '2026-11-16 07:00:06');
