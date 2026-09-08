-- 02_seed_data.sql
-- Datos iniciales y catálogos maestros para "Separa Altoke"

-- Países
INSERT INTO _pais (codigo_iso, nombre, prefijo_telefonico, longitud_celular_esperada) VALUES
('PE', 'Perú', '+51', 9),
('CO', 'Colombia', '+57', 10),
('CL', 'Chile', '+56', 9);

-- Ubigeo
INSERT INTO _ubigeo_departamento (id, nombre) VALUES ('14', 'Lambayeque'), ('15', 'Lima');
INSERT INTO _ubigeo_provincia (id, departamento_id, nombre) VALUES ('1401', '14', 'Chiclayo'), ('1501', '15', 'Lima');
INSERT INTO _ubigeo_distrito (id, provincia_id, nombre) VALUES 
('140101', '1401', 'Chiclayo'),
('150122', '1501', 'Miraflores'),
('150141', '1501', 'Surquillo');

-- Configuración Global
INSERT INTO _sistema_configuracion (clave, valor, descripcion) VALUES
('APP_MIN_VERSION_ANDROID', '"1.0.0"', 'Versión mínima requerida de la app Android'),
('MAX_PENDING_PAYMENT_MINUTES', '15', 'Tiempo máximo en minutos para que una reserva pendiente espere'),
('PLATFORM_FEE_PERCENTAGE', '0.00', 'Comisión global de la plataforma'),
('MANTENIMIENTO_ACTIVO', 'false', 'Bandera para poner el sistema en modo mantenimiento');

-- Deportes
INSERT INTO _deporte (id, nombre, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'Fútbol 5', true),
('22222222-2222-2222-2222-222222222222', 'Fútbol 7', true),
('33333333-3333-3333-3333-333333333333', 'Fútbol 11', true),
('44444444-4444-4444-4444-444444444444', 'Vóley', true);

-- Servicios
INSERT INTO _servicio (id, nombre, icono, categoria) VALUES
('55555555-5555-5555-5555-555555555551', 'Estacionamiento', 'parking', 'Comodidad'),
('55555555-5555-5555-5555-555555555552', 'Tienda Snack', 'store', 'Alimentos'),
('55555555-5555-5555-5555-555555555553', 'Baños', 'bath', 'Comodidad'),
('55555555-5555-5555-5555-555555555554', 'Duchas', 'shower', 'Comodidad'),
('55555555-5555-5555-5555-555555555555', 'Vestidores', 'shirt', 'Comodidad'),
('55555555-5555-5555-5555-555555555556', 'WiFi', 'wifi', 'Conectividad'),
('55555555-5555-5555-5555-555555555557', 'Seguridad', 'shield', 'Seguridad'),
('55555555-5555-5555-5555-555555555558', 'Cámara', 'video', 'Seguridad');

-- Planes de Suscripción
INSERT INTO _plan_suscripcion (id, nombre, descripcion, precio_mensual, precio_anual, max_sedes, max_canchas, beneficios) VALUES
('66666666-6666-6666-6666-666666666666', 'Plan Freemium', 'Plan gratuito con funciones básicas.', 0.00, 0.00, 1, 3, '{"fotos_cancha": false}'),
('77777777-7777-7777-7777-777777777777', 'Plan Premium B2B', 'Plan profesional.', 99.00, 990.00, 3, 10, '{"fotos_cancha": true}');
