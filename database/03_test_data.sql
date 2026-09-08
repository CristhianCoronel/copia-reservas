-- 03_test_data.sql
-- Datos de prueba realistas para Chiclayo Centro

-- 1. Usuarios y Personas
INSERT INTO usuario (id, username, email, telefono, proveedor_auth, rol, is_active, email_verificado) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin_altoke', 'admin@separaaltoke.com', '+51999999999', 'LOCAL', 'ADMIN', true, true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dueño_chiclayo', 'dueno@chiclayo.com', '+51987654321', 'GOOGLE', 'PLAYER', true, true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'jugador_pro', 'jugador@test.com', '+51912345678', 'GOOGLE', 'PLAYER', true, true);

INSERT INTO persona (id, usuario_id, nombres, apellidos, tipo_documento, numero_documento, created_by, updated_by) VALUES 
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Admin', 'Sistema', 'DNI', '00000000', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Carlos', 'Chiclayo', 'DNI', '11111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Juan', 'García', 'DNI', '22222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- Monederos
INSERT INTO monedero (persona_id, saldo_disponible, saldo_retenido, created_by, updated_by) VALUES 
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 0.00, 0.00, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 100.00, 0.00, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- 2. Empresa y Suscripción
INSERT INTO empresa (id, creada_por_persona_id, share_token, ruc, razon_social, nombre_comercial, estado_aprobacion, telefono_contacto, email_contacto, created_by, updated_by) VALUES 
('00000000-0000-0000-0000-000000000001', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'chiclayo-share', '20123456789', 'Deportes Chiclayo SAC', 'Chiclayo Deportes', 'APROBADA', '+51987654321', 'contacto@chiclayo.com', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

INSERT INTO contrato (empresa_id, persona_id, rol, otorgado_por, fecha_inicio, is_active, created_by, updated_by) VALUES 
('00000000-0000-0000-0000-000000000001', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ADMINISTRADOR', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '2026-09-01', true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

INSERT INTO suscripcion_empresa (empresa_id, plan_id, fecha_inicio, fecha_fin, estado, created_by, updated_by) VALUES 
('00000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-777777777777', '2026-09-01', '2027-09-01', 'ACTIVA', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- 3. Sede, Horarios y Canchas
INSERT INTO sede (id, empresa_id, ubigeo_distrito_id, nombre, direccion, latitud, longitud, telefono, tipo_adelanto_requerido, valor_adelanto_requerido, created_by, updated_by) VALUES 
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '140101', 'Sede Chiclayo Centro', 'Av. Balta 123, Chiclayo', -6.771, -79.840, '+51987654321', 'PORCENTAJE', 50.00, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Horarios Sede
INSERT INTO sede_horario_atencion (sede_id, dia_semana, hora_apertura, hora_cierre, created_by, updated_by) VALUES 
('00000000-0000-0000-0000-000000000002', 0, '08:00', '23:59', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('00000000-0000-0000-0000-000000000002', 1, '08:00', '23:59', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('00000000-0000-0000-0000-000000000002', 2, '08:00', '23:59', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('00000000-0000-0000-0000-000000000002', 3, '08:00', '23:59', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('00000000-0000-0000-0000-000000000002', 4, '08:00', '23:59', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('00000000-0000-0000-0000-000000000002', 5, '08:00', '23:59', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('00000000-0000-0000-0000-000000000002', 6, '08:00', '23:59', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Servicios Sede
INSERT INTO sede_servicio (sede_id, _servicio_id, es_gratuito) VALUES
('00000000-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555551', true), -- Estacionamiento
('00000000-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555553', true), -- Baños
('00000000-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555554', true), -- Duchas
('00000000-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555552', false); -- Snack

-- Cancha 1: Fútbol 7
INSERT INTO cancha (id, sede_id, nombre, _deporte_id, modalidades, caracteristicas, created_by, updated_by) VALUES 
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'La 7 de Balta (Sintético)', '22222222-2222-2222-2222-222222222222', '{"Fútbol 7"}', '{"superficie": "Grass Sintético", "techada": false, "reglas": "Prohibido chimpunes con toperoles de aluminio."}', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

INSERT INTO cancha_horario (cancha_id, dia_semana, hora_inicio, hora_fin, precio_por_hora, recargo_luz, created_by, updated_by) VALUES 
('00000000-0000-0000-0000-000000000003', 0, '08:00', '18:00', 50.00, 0.00, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('00000000-0000-0000-0000-000000000003', 0, '18:00', '23:59', 90.00, 0.00, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Cancha 2: Fútbol 5
INSERT INTO cancha (id, sede_id, nombre, _deporte_id, modalidades, caracteristicas, created_by, updated_by) VALUES 
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'El 5 Rápido (Sintético)', '11111111-1111-1111-1111-111111111111', '{"Fútbol 5"}', '{"superficie": "Grass Sintético", "techada": true, "reglas": "Uso obligatorio de zapatillas de futsal."}', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

INSERT INTO cancha_horario (cancha_id, dia_semana, hora_inicio, hora_fin, precio_por_hora, recargo_luz, created_by, updated_by) VALUES 
('00000000-0000-0000-0000-000000000004', 0, '08:00', '18:00', 40.00, 0.00, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('00000000-0000-0000-0000-000000000004', 0, '18:00', '23:59', 80.00, 0.00, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- 4. Reserva
INSERT INTO reserva (
    id, share_token, cancha_id, tipo_origen, persona_organizadora_id, 
    fecha_reserva, hora_inicio_solicitada, hora_fin_solicitada, hora_inicio, hora_fin, 
    duracion_horas, precio_hora_historico, precio_total_cancha, 
    monto_total_final, _saldo_pendiente, estado, created_by, updated_by
) VALUES (
    '00000000-0000-0000-0000-000000000005', 'reserva-test-token', '00000000-0000-0000-0000-000000000003', 'INDIVIDUAL', 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    CURRENT_DATE + INTERVAL '7 days', '20:00', '21:00', '20:00', '21:00',
    1.0, 90.00, 90.00, 90.00, 45.00, 'PENDIENTE_PAGO', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc'
);
