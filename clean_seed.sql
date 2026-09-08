TRUNCATE TABLE reserva CASCADE;
TRUNCATE TABLE cancha_horario CASCADE;
TRUNCATE TABLE cancha CASCADE;
TRUNCATE TABLE sede_servicio CASCADE;
TRUNCATE TABLE sede CASCADE;
TRUNCATE TABLE empresa CASCADE;
TRUNCATE TABLE persona CASCADE;
TRUNCATE TABLE usuario CASCADE;
TRUNCATE TABLE _deporte CASCADE;
TRUNCATE TABLE _servicio CASCADE;

INSERT INTO _deporte (id, nombre, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'Fútbol 5', true),
('22222222-2222-2222-2222-222222222222', 'Fútbol 7', true),
('33333333-3333-3333-3333-333333333333', 'Fútbol 11', true),
('44444444-4444-4444-4444-444444444444', 'Vóley', true);

INSERT INTO _servicio (id, nombre, icono, categoria) VALUES
('55555555-5555-5555-5555-555555555551', 'Estacionamiento', 'parking', 'Comodidad'),
('55555555-5555-5555-5555-555555555552', 'Tienda Snack', 'store', 'Alimentos'),
('55555555-5555-5555-5555-555555555553', 'Baños', 'bath', 'Comodidad'),
('55555555-5555-5555-5555-555555555554', 'Duchas', 'shower', 'Comodidad'),
('55555555-5555-5555-5555-555555555555', 'Vestidores', 'shirt', 'Comodidad'),
('55555555-5555-5555-5555-555555555556', 'WiFi', 'wifi', 'Conectividad'),
('55555555-5555-5555-5555-555555555557', 'Seguridad', 'shield', 'Seguridad'),
('55555555-5555-5555-5555-555555555558', 'Cámara', 'video', 'Seguridad');

INSERT INTO usuario (id, username, email, telefono, proveedor_auth, rol, is_active, email_verificado) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin', 'admin@test.com', '+51999999999', 'LOCAL', 'ADMIN', true, true);

INSERT INTO persona (id, usuario_id, nombres, apellidos, tipo_documento, numero_documento, created_by, updated_by) VALUES 
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Admin', 'Test', 'DNI', '00000000', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

INSERT INTO empresa (id, creada_por_persona_id, share_token, ruc, razon_social, nombre_comercial, estado_aprobacion, telefono_contacto, email_contacto, created_by, updated_by) VALUES 
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'test-token', '20123456789', 'Empresa Test', 'Chiclayo Deportes', 'APROBADA', '+51999888777', 'contacto@test.com', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

INSERT INTO sede (id, empresa_id, ubigeo_distrito_id, nombre, direccion, latitud, longitud, telefono, tipo_adelanto_requerido, valor_adelanto_requerido, created_by, updated_by) VALUES 
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '150141', 'Sede Chiclayo Centro', 'Av. Balta 123, Chiclayo', -6.771, -79.840, '+51999888777', 'PORCENTAJE', 50.00, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Cancha 1: Futbol 7
INSERT INTO cancha (id, sede_id, nombre, _deporte_id, modalidades, caracteristicas, created_by, updated_by) VALUES 
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'La 7 de Balta', '22222222-2222-2222-2222-222222222222', '{"Fútbol 7"}', '{"superficie": "Grass Sintético", "techada": false}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Tarifas Cancha 1
INSERT INTO cancha_horario (cancha_id, dia_semana, hora_inicio, hora_fin, precio_por_hora, recargo_luz, created_by, updated_by) VALUES 
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 0, '08:00', '18:00', 50.00, 0.00, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 0, '18:00', '23:59', 90.00, 0.00, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Cancha 2: Futbol 5
INSERT INTO cancha (id, sede_id, nombre, _deporte_id, modalidades, caracteristicas, created_by, updated_by) VALUES 
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'El 5 Rápido', '11111111-1111-1111-1111-111111111111', '{"Fútbol 5"}', '{"superficie": "Grass Sintético", "techada": true}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Tarifas Cancha 2
INSERT INTO cancha_horario (cancha_id, dia_semana, hora_inicio, hora_fin, precio_por_hora, recargo_luz, created_by, updated_by) VALUES 
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 0, '08:00', '18:00', 40.00, 0.00, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 0, '18:00', '23:59', 80.00, 0.00, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Cancha 3: Futbol 11
INSERT INTO cancha (id, sede_id, nombre, _deporte_id, modalidades, caracteristicas, created_by, updated_by) VALUES 
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'La 11 Oficial', '33333333-3333-3333-3333-333333333333', '{"Fútbol 11"}', '{"superficie": "Grass Natural", "techada": false}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
INSERT INTO cancha_horario (cancha_id, dia_semana, hora_inicio, hora_fin, precio_por_hora, recargo_luz, created_by, updated_by) VALUES 
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 0, '08:00', '18:00', 80.00, 0.00, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 0, '18:00', '23:59', 100.00, 0.00, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Servicios Sede
INSERT INTO sede_servicio (sede_id, _servicio_id, es_gratuito) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', '55555555-5555-5555-5555-555555555551', true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '55555555-5555-5555-5555-555555555553', true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '55555555-5555-5555-5555-555555555554', true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '55555555-5555-5555-5555-555555555555', true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '55555555-5555-5555-5555-555555555552', false);
