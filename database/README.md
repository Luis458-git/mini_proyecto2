# Base de Datos: `rrhh_ticotech`
**Proyecto:** TicoTech HR Portal (Costa Rica)  
**Motor:** MySQL 8.0+ (`InnoDB`, charset `utf8mb4`, collation `utf8mb4_unicode_ci`)

---

## Archivos en esta carpeta

- **[rrhh_ticotech.sql](./rrhh_ticotech.sql)**: Script SQL completo listo para ejecución. Contiene:
  - `CREATE DATABASE` con configuración UTF-8.
  - **22 tablas (DDL)** con todas sus llaves primarias `AUTO_INCREMENT`, restricciones `UNIQUE`, índices y llaves foráneas explícitas (`ON DELETE CASCADE` o `ON DELETE SET NULL`).
  - **Datos simulados (DML)** de Costa Rica para septiembre, octubre y noviembre 2026 (50 colaboradores, feriados 2026, deducciones CCSS 10.67%, saldos con pasivo laboral > 20 días, etc.).

---

## Cómo ejecutarlo

### Opción 1: En MySQL Workbench (Recomendada)
1. Abre **MySQL Workbench** e ingresa a tu conexión local (`localhost:3306`).
2. Ve a **File > Open SQL Script...** (o presiona `Ctrl + Shift + O`) y selecciona este archivo:
   `database/rrhh_ticotech.sql`
3. Presiona el botón del **rayo completo** ⚡ o presiona `Ctrl + Shift + Enter`.
4. En el panel izquierdo (**Schemas**), haz clic derecho y selecciona **Refresh All** para ver la base de datos `rrhh_ticotech` y sus 22 tablas.

### Opción 2: Desde Node.js
Configura tu contraseña en `backend/.env` y ejecuta desde la carpeta `backend`:
```bash
npm run init-db
```

### Opción 3: Desde MySQL CLI (PowerShell)
```powershell
Get-Content .\database\rrhh_ticotech.sql -Raw | mysql -u root -p -h 127.0.0.1 -P 3306
```

---

## Resumen de las 22 Tablas

1. `departamentos` (5 departamentos de TicoTech)
2. `puestos` (12 puestos técnicos y de liderazgo)
3. `colaboradores` (50 colaboradores: 1 admin, 4 rrhh, 45 colaboradores; 45 activos y 5 inactivos)
4. `saldos_vacaciones` (50 registros; columna calculada `dias_disponibles` STORED)
5. `solicitudes` (35 solicitudes: vacaciones, paternidad, matrimonio, etc.)
6. `incapacidades` (15 registros CCSS e INS con boletas oficiales)
7. `movimientos_personal` (60 registros: contrataciones, ascensos, ajustes salariales, cambios de teletrabajo)
8. `feriados` (Los 12 feriados oficiales de Costa Rica 2026)
9. `registro_asistencia` (30 marcas de asistencia presencial y teletrabajo)
10. `horas_extra` (15 registros de horas extraordinarias diurnas, mixtas, nocturnas y feriados)
11. `periodos_pago` (3 periodos quincenales recientes)
12. `planillas` (45 comprobantes con deducciones CCSS 10.67%, impuesto de renta y ASETEC)
13. `beneficios` (5 beneficios corporativos)
14. `colaborador_beneficios` (40 afiliaciones activas)
15. `evaluaciones_desempeno` (25 evaluaciones semestrales con OKRs y PIPs)
16. `capacitaciones` (4 cursos de formación técnica y legal)
17. `capacitaciones_inscripciones` (20 inscripciones)
18. `denuncias_etica` (3 reportes confidenciales del canal ético)
19. `documentos_politicas` (10 políticas sincronizadas con Google Drive)
20. `consultas_chat` (40 consultas históricas con intención y agente clasificado)
21. `tickets_escalamiento` (6 tickets abiertos asignados a RRHH)
22. `reportes_diarios` (3 reportes diarios generados por el cron job)
