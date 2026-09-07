-- 02_seed_data.sql
-- Datos iniciales y catálogos maestros para "Separa Altoke"

-- Países
INSERT INTO _pais (codigo_iso, nombre, prefijo_telefonico, longitud_celular_esperada) VALUES
('PE', 'Perú', '+51', 9),
('CO', 'Colombia', '+57', 10),
('CL', 'Chile', '+56', 9);

-- Ubigeo (Ejemplo Mínimo: Lima - Lima - Miraflores / Surquillo)
INSERT INTO _ubigeo_departamento (id, nombre) VALUES ('15', 'Lima');

INSERT INTO _ubigeo_provincia (id, departamento_id, nombre) VALUES ('1501', '15', 'Lima');

INSERT INTO _ubigeo_distrito (id, provincia_id, nombre) VALUES 
('150122', '1501', 'Miraflores'),
('150140', '1501', 'Santiago de Surco'),
('150141', '1501', 'Surquillo');

-- Configuración Global del Sistema
INSERT INTO _sistema_configuracion (clave, valor, descripcion) VALUES
('APP_MIN_VERSION_ANDROID', '"1.0.0"', 'Versión mínima requerida de la app Android'),
('MAX_PENDING_PAYMENT_MINUTES', '15', 'Tiempo máximo en minutos para que una reserva pendiente espere el pago por defecto'),
('PLATFORM_FEE_PERCENTAGE', '0.00', 'Comisión global de la plataforma sobre pagos online'),
('MANTENIMIENTO_ACTIVO', 'false', 'Bandera para poner el sistema en modo mantenimiento');

-- Deportes
INSERT INTO _deporte (id, nombre, is_active) VALUES
('d1a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'Fútbol', true),
('d2a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'Pádel', true),
('d3a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'Tenis', true),
('d4a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'Básquet', true),
('d5a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'Vóley', true);

-- Servicios Adicionales en Sedes
INSERT INTO _servicio (id, nombre, icono, categoria) VALUES
('s1a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'Estacionamiento Privado', 'parking', 'Comodidad'),
('s2a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'Duchas / Vestuarios', 'shower', 'Comodidad'),
('s3a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'Quiosco / Bar', 'store', 'Alimentos'),
('s4a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'Wifi Gratis', 'wifi', 'Conectividad'),
('s5a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'Iluminación LED', 'lightbulb', 'Infraestructura');

-- Planes de Suscripción
INSERT INTO _plan_suscripcion (id, nombre, descripcion, precio_mensual, precio_anual, max_sedes, max_canchas, beneficios) VALUES
('p1a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'Plan Freemium', 'Plan gratuito con funciones básicas, ideal para empezar.', 0.00, 0.00, 1, 3, '{"fotos_cancha": false, "coordenadas_gps": false, "notificaciones_email": false, "max_dias_registro": 3, "trabajadores_extra": false}'),
('p2a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'Plan Premium B2B', 'Plan profesional con todas las funciones activas y máxima visibilidad.', 99.00, 990.00, 3, 10, '{"fotos_cancha": true, "coordenadas_gps": true, "notificaciones_email": true, "max_dias_registro": 14, "trabajadores_extra": true}');
