-- 03_test_data.sql
-- Datos de prueba B2B y B2C para validación de flujos con Auditoría

-- 1. Crear Usuarios y Personas
-- Usuario Administrador de la Plataforma
INSERT INTO usuario (id, username, codigo_referido, email, telefono, proveedor_auth, rol, is_active, email_verificado) VALUES 
('11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'admin_altoke', 'ADM123', 'admin@separaaltoke.com', '+51999999999', 'LOCAL', 'ADMIN', true, true);

INSERT INTO persona (id, usuario_id, nombres, apellidos, tipo_documento, numero_documento, created_by, updated_by) VALUES 
('22a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'Admin', 'Separa Altoke', 'DNI', '00000000', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d');

-- Usuario Administrador de Empresa
INSERT INTO usuario (id, username, codigo_referido, email, telefono, proveedor_auth, rol, is_active, email_verificado) VALUES 
('11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'carlos_dueño', 'CAR456', 'carlos@dueño.com', '+51987654321', 'GOOGLE', 'PLAYER', true, true);

INSERT INTO persona (id, usuario_id, nombres, apellidos, tipo_documento, numero_documento, created_by, updated_by) VALUES 
('22a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'Carlos', 'Pérez', 'DNI', '11111111', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d');

-- Usuario Jugador Regular
INSERT INTO usuario (id, username, codigo_referido, email, telefono, proveedor_auth, rol, is_active, email_verificado) VALUES 
('11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'jugador_pro', 'JUG789', 'jugador@test.com', '+51912345678', 'GOOGLE', 'PLAYER', true, true);

INSERT INTO persona (id, usuario_id, nombres, apellidos, tipo_documento, numero_documento, created_by, updated_by) VALUES 
('22a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'Juan', 'García', 'DNI', '22222222', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d');

-- Monederos para Personas
INSERT INTO monedero (persona_id, saldo_disponible, saldo_retenido, created_by, updated_by) VALUES 
('22a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 0.00, 0.00, '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d'),
('22a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 100.00, 0.00, '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d'); -- Jugador tiene saldo inicial

-- 2. Crear Empresa y Suscripción
INSERT INTO empresa (id, creada_por_persona_id, share_token, ruc, razon_social, nombre_comercial, estado_aprobacion, telefono_contacto, email_contacto, created_by, updated_by) VALUES 
('33a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '22a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'tripledoble-share', '20123456789', 'Deportes Triple Doble SAC', 'Complejo Triple Doble', 'APROBADA', '+51987654321', 'contacto@tripledoble.com', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d');

-- Contrato del creador como ADMIN_EMPRESA
INSERT INTO contrato (empresa_id, persona_id, rol, otorgado_por, fecha_inicio, is_active, created_by, updated_by) VALUES 
('33a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '22a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'ADMINISTRADOR', '22a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '2026-09-01', true, '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d');

-- Suscripción Premium
INSERT INTO suscripcion_empresa (empresa_id, plan_id, fecha_inicio, fecha_fin, estado, created_by, updated_by) VALUES 
('33a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '88a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '2026-09-01', '2027-09-01', 'ACTIVA', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d');

-- 3. Crear Sede, Horarios y Canchas
INSERT INTO sede (id, empresa_id, ubigeo_distrito_id, nombre, direccion, latitud, longitud, telefono, tipo_adelanto_requerido, valor_adelanto_requerido, created_by, updated_by) VALUES 
('44a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '33a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '150141', 'Sede Surquillo Principal', 'Av. Tomás Marsano 123', -12.115, -77.012, '+51987654321', 'PORCENTAJE', 50.00, '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d');

-- Horario Sede (Lunes a Domingo 08:00 - 23:00)
INSERT INTO sede_horario_atencion (sede_id, dia_semana, hora_apertura, hora_cierre, created_by, updated_by) VALUES 
('44a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 0, '08:00', '23:00', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d'),
('44a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 1, '08:00', '23:00', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d'),
('44a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 2, '08:00', '23:00', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d'),
('44a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 3, '08:00', '23:00', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d'),
('44a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 4, '08:00', '23:00', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d'),
('44a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 5, '08:00', '23:00', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d'),
('44a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 6, '08:00', '23:00', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d');

-- Cancha 1 (Fútbol 7)
INSERT INTO cancha (id, sede_id, nombre, _deporte_id, modalidades, created_by, updated_by) VALUES 
('55a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '44a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'Cancha 1 - Sintético', '99a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '{"Fútbol 7"}', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d');

-- Tarifa Cancha 1 (S/. 100 de día, S/. 120 de noche) para el día Lunes (0)
INSERT INTO cancha_horario (cancha_id, dia_semana, hora_inicio, hora_fin, precio_por_hora, recargo_luz, created_by, updated_by) VALUES 
('55a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 0, '08:00', '18:00', 100.00, 0.00, '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d'),
('55a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 0, '18:00', '23:00', 100.00, 20.00, '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d');

-- 4. Reserva de Prueba
-- Jugador hace una reserva para el Lunes próximo a las 20:00 (S/. 120)
INSERT INTO reserva (
    id, share_token, cancha_id, tipo_origen, persona_organizadora_id, 
    fecha_reserva, hora_inicio_solicitada, hora_fin_solicitada, hora_inicio, hora_fin, 
    duracion_horas, precio_hora_historico, precio_total_cancha, 
    monto_total_final, _saldo_pendiente, estado, created_by, updated_by
) VALUES (
    '66a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'reserva-test-token', '55a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'INDIVIDUAL', '22a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d',
    CURRENT_DATE + INTERVAL '7 days', '20:00', '21:00', '20:00', '21:00',
    1.0, 120.00, 120.00, 120.00, 60.00, 'PENDIENTE_PAGO', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d'
);

-- Jugador abonó S/ 60 como seña
INSERT INTO pago_reserva (reserva_id, persona_id, monto, metodo_pago, estado, created_by, updated_by) VALUES 
('66a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '22a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 60.00, 'YAPE', 'APROBADO', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d');
