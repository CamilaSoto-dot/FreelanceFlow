-- =============================================================================
-- BASE DE DATOS: FreelanceFlow Control
-- SCRIPT DE CREACIÓN DE ESQUEMA, SEEDING DE DATOS SIMULADOS Y VISTAS ANALÍTICAS
-- Motor Recomendado: PostgreSQL / Google Cloud SQL
-- Autor: Especialista de Base de Datos
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SECCIÓN DDL (Data Definition Language) - Estructuras y Relaciones
-- -----------------------------------------------------------------------------

-- Opcional: Creación de la base de datos si se ejecuta en un ambiente local vacío
-- CREATE DATABASE freelanceflow_db;
-- \c freelanceflow_db;

-- Tabla de Usuarios (Freelancers activos)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Clientes
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    company_name VARCHAR(150),
    email VARCHAR(150),
    phone VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Tarifas de Servicio (Configuración preestablecida por tipo de servicio)
CREATE TABLE service_rates (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    rate_per_hour NUMERIC(12, 2) NOT NULL CHECK (rate_per_hour > 0),
    currency VARCHAR(10) DEFAULT 'CLP', -- Puede adaptarse a USD, MXN, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Proyectos
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    estimated_hours NUMERIC(6, 2),
    status VARCHAR(50) DEFAULT 'Activo' CHECK (status IN ('Activo', 'Pausado', 'Completado', 'Cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Facturas (Invoices) - Soporta la lógica financiera exacta del Dashboard
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount <= total_amount),
    status VARCHAR(50) DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Parcial', 'Pagada', 'Vencida')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Registro de Horas (Time Tracker - Tracker en Vivo)
CREATE TABLE time_logs (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    service_rate_id INT REFERENCES service_rates(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_hours NUMERIC(8, 2) GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time))/3600.0
    ) STORED,
    description TEXT,
    is_billed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_time_order CHECK (end_time IS NULL OR end_time >= start_time)
);

-- -----------------------------------------------------------------------------
-- ÍNDICES DE RENDIMIENTO (Performance Tuning para filtros de período y búsquedas)
-- -----------------------------------------------------------------------------
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_time_logs_project ON time_logs(project_id, start_time);
CREATE INDEX idx_projects_user ON projects(user_id);


-- -----------------------------------------------------------------------------
-- 2. SECCIÓN DML (Data Manipulation Language) - Seed de Datos de Simulación Realistas
-- -----------------------------------------------------------------------------

-- Insertar el perfil de Cami Soto
INSERT INTO users (name, email, photo_url)
VALUES (
    'Cami Soto', 
    'cami.soto.ceri@gmail.com', 
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
);

-- Insertar clientes para Cami Soto (UserID = 1)
INSERT INTO clients (user_id, name, company_name, email, phone)
VALUES 
    (1, 'Estudio Creativo Alpha', 'Alpha Studio LLC', 'contacto@estudioalpha.com', '+56 9 8765 4321'),
    (1, 'Tech Innovations Corp', 'Innovations S.A.', 'billing@techcorp.com', '+56 2 2345 6789'),
    (1, 'Pyme Digital Limitada', 'Pyme Digital Ltda', 'admin@pymedigital.cl', '+56 9 1122 3344');

-- Insertar tarifas por tipo de servicio (USD o CLP equivalente)
INSERT INTO service_rates (user_id, service_name, rate_per_hour, currency)
VALUES 
    (1, 'Desarrollo Frontend React', 25000.00, 'CLP'),
    (1, 'Consultoría de Arquitectura Cloud', 45000.00, 'CLP'),
    (1, 'Diseño de Interfaz UI/UX', 15000.00, 'CLP');

-- Insertar Proyectos asociados a los clientes de Cami
INSERT INTO projects (user_id, client_id, name, description, estimated_hours, status)
VALUES 
    (1, 1, 'Plataforma Educativa LMS', 'Maquetación frontend de panel educativo interactivo', 80.00, 'Activo'),
    (1, 2, 'Migración Cloud e-Commerce', 'Consultoría de arquitectura elástica de AWS a GCP', 40.00, 'Completado'),
    (1, 3, 'Rediseño de Marca Web', 'Diseño de wireframes, guías de estilo y componentes UX', 50.00, 'Activo');

-- -----------------------------------------------------------------------------
-- CÓMPUTO DE TRANSACCIONES FINANCIERAS (Asegura cuadrar exactamente los montos indicados):
-- Facturas emitidas durante el año 2026 para registrar:
-- Total Facturado: $7.555.000 / Ingresos Recibidos: $6.555.000 / Por Cobrar: $1.000.000
-- Q1: Factura 001 (Estudio Alpha) -> $3.205.000 Billed, $3.205.000 Paid (PAGADO)
-- Q2: Factura 002 (Innovations Corp) -> $1.350.000 Billed, $1.350.000 Paid (PAGADO)
-- Q3: Factura 003 (Estudio Alpha) -> $2.000.000 Billed, $2.000.000 Paid (PAGADO)
-- Q3: Factura 004 (Pyme Digital) -> $1.000.000 Billed, $0 Paid (PENDIENTE)
-- 
-- Sumas totales: 
-- Facturado: 3.205.000 + 1.350.000 + 2.000.000 + 1.000.000 = $7.555.000
-- Pagado (Ingresos Recibidos): 3.205.000 + 1.350.000 + 2.000.000 = $6.555.000
-- Por Cobrar: 1.000.000
-- -----------------------------------------------------------------------------
INSERT INTO invoices (project_id, invoice_number, issue_date, due_date, total_amount, paid_amount, status)
VALUES 
    (1, 'INV-2026-001', '2026-02-15', '2026-03-15', 3205000.00, 3205000.00, 'Pagada'), -- Q1
    (2, 'INV-2026-002', '2026-05-10', '2026-06-10', 1350000.00, 1350000.00, 'Pagada'), -- Q2
    (1, 'INV-2026-003', '2026-08-20', '2026-09-20', 2000000.00, 2000000.00, 'Pagada'), -- Q3
    (3, 'INV-2026-004', '2026-09-05', '2026-10-05', 1000000.00, 0.00, 'Pendiente');  -- Q3

-- Insertar logs de horas trabajadas (Seeding Tracker en Vivo)
INSERT INTO time_logs (project_id, service_rate_id, start_time, end_time, description, is_billed)
VALUES 
    -- Logs en Proyecto 1 (LMS) - Desarrollo Frontend (Tasa CLP 25000)
    (1, 1, '2026-06-18 09:00:00-04', '2026-06-18 13:30:00-04', 'Maquetación de la landing page con Tailwind css', TRUE),
    (1, 1, '2026-06-18 14:30:00-04', '2026-06-18 19:00:00-04', 'Integración de estado de hooks globales y ruteo dinámico', TRUE),
    -- Logs en Proyecto 2 (Cloud) - Consultoría Cloud (Tasa CLP 45000)
    (2, 2, '2026-05-02 10:00:00-04', '2026-05-02 14:00:00-04', 'Diseño de red VPC elástica y balanceadores de carga en GCP', TRUE),
    -- Tracker actual activo (Hipotéticamente simulando el Tracker en Vivo que se está cronometrando en el momento)
    (3, 3, '2026-06-19 08:00:00-04', '2026-06-19 12:00:00-04', 'Exploración inicial de UX y wireframing móvil interactivo', FALSE);


-- -----------------------------------------------------------------------------
-- 3. VISTAS ANALÍTICAS (VIEWs de apoyo directo para el Backend)
-- -----------------------------------------------------------------------------

-- VISTA 1: vista_diagnostico_trimestral
-- Consolida los ingresos, montos cobrados, montos pendientes y avance de rendimiento
-- estructurado bajo los trimestres fiscales (Q1, Q2, Q3, Q4) de manera agregada por año.
CREATE OR REPLACE VIEW vista_diagnostico_trimestral AS
SELECT 
    u.id AS user_id,
    u.email AS user_email,
    EXTRACT(YEAR FROM i.issue_date) AS anio,
    CASE 
        WHEN EXTRACT(MONTH FROM i.issue_date) BETWEEN 1 AND 3 THEN 'Q1'
        WHEN EXTRACT(MONTH FROM i.issue_date) BETWEEN 4 AND 6 THEN 'Q2'
        WHEN EXTRACT(MONTH FROM i.issue_date) BETWEEN 7 AND 9 THEN 'Q3'
        ELSE 'Q4'
    END AS trimestre,
    COUNT(i.id) AS total_facturas_emitidas,
    SUM(i.total_amount) AS total_facturado_clp,
    SUM(i.paid_amount) AS total_recibido_clp,
    (SUM(i.total_amount) - SUM(i.paid_amount)) AS cuentas_por_cobrar_clp,
    ROUND((SUM(i.paid_amount) / SUM(i.total_amount)) * 100, 2) AS porcentaje_cobro_efectivo
FROM users u
JOIN projects p ON p.user_id = u.id
JOIN invoices i ON i.project_id = p.id
GROUP BY u.id, u.email, anio, trimestre
ORDER BY anio DESC, trimestre ASC;

-- VISTA 2: vista_resumen_proyectos_horas
-- Proporciona una auditoría de proyectos agrupada por clientes, sumando las horas
-- registradas por los timers analíticos contra las estimaciones asignadas al inicio.
CREATE OR REPLACE VIEW vista_resumen_proyectos_horas AS
SELECT 
    p.id AS project_id,
    p.name AS proyecto_nombre,
    c.name AS cliente_nombre,
    c.company_name AS empresa_cliente,
    p.status AS estado_proyecto,
    p.estimated_hours AS horas_estimadas,
    COALESCE(SUM(tl.duration_hours), 0.00) AS horas_trabajadas_cronometradas,
    (p.estimated_hours - COALESCE(SUM(tl.duration_hours), 0.00)) AS horas_restantes,
    -- Estimación del valor de las horas registradas según la tarifa establecida
    COALESCE(SUM(tl.duration_hours * sr.rate_per_hour), 0.00) AS valor_tiempo_registrado_clp
FROM projects p
JOIN clients c ON p.client_id = c.id
LEFT JOIN time_logs tl ON tl.project_id = p.id
LEFT JOIN service_rates sr ON tl.service_rate_id = sr.id
GROUP BY p.id, p.name, c.name, c.company_name, p.status, p.estimated_hours
ORDER BY horas_trabajadas_cronometradas DESC;

-- =============================================================================
-- SENTENCIAS DE PRUEBA RÁPIDA (Comprobar coherencia con el panel de Cami Soto)
-- =============================================================================
-- 
-- 1. Consultar indicadores totales agregados de Cami:
--    SELECT SUM(total_amount) AS Facturado, SUM(paid_amount) AS Recibido, SUM(total_amount - paid_amount) AS Por_Cobrar FROM invoices;
--
-- 2. Consultar desglose trimestral (Q1, Q2, Q3):
--    SELECT * FROM vista_diagnostico_trimestral WHERE user_id = 1;
--
-- 3. Consultar distribución del Tracker / Horas Proyecto:
--    SELECT * FROM vista_resumen_proyectos_horas;