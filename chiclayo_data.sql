-- Inserción de datos de Chiclayo
-- Sede Chiclayo
INSERT INTO sede (id, empresa_id, ubigeo_distrito_id, nombre, direccion, latitud, longitud, telefono, tipo_adelanto_requerido, valor_adelanto_requerido, created_by, updated_by) VALUES 
('44a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '33a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '150122', 'Sede Chiclayo Centro', 'Av. Balta 123, Chiclayo', -6.771, -79.840, '+51999888777', 'PORCENTAJE', 50.00, '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d') ON CONFLICT DO NOTHING;

-- Cancha 1: Futbol 7 - Grass Sintético
INSERT INTO cancha (id, sede_id, nombre, _deporte_id, modalidades, caracteristicas, created_by, updated_by) VALUES 
('55a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '44a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'La 7 de Balta', '99a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '{"Fútbol 7"}', '{"superficie": "Grass Sintético", "techada": false}', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d') ON CONFLICT DO NOTHING;

-- Tarifas Cancha 1 (usamos varios días o por defecto 0)
INSERT INTO cancha_horario (cancha_id, dia_semana, hora_inicio, hora_fin, precio_por_hora, recargo_luz, created_by, updated_by) VALUES 
('55a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 0, '08:00', '18:00', 50.00, 0.00, '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d'),
('55a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 0, '18:00', '23:59', 90.00, 0.00, '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d') ON CONFLICT DO NOTHING;

-- Cancha 2: Futbol 5 - Grass Sintético
INSERT INTO cancha (id, sede_id, nombre, _deporte_id, modalidades, caracteristicas, created_by, updated_by) VALUES 
('55a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '44a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'El 5 Rápido', '99a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '{"Fútbol 5"}', '{"superficie": "Grass Sintético", "techada": true}', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d') ON CONFLICT DO NOTHING;

-- Tarifas Cancha 2
INSERT INTO cancha_horario (cancha_id, dia_semana, hora_inicio, hora_fin, precio_por_hora, recargo_luz, created_by, updated_by) VALUES 
('55a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 0, '08:00', '18:00', 40.00, 0.00, '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d'),
('55a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 0, '18:00', '23:59', 80.00, 0.00, '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d') ON CONFLICT DO NOTHING;

-- Cancha 3: Futbol 11
INSERT INTO cancha (id, sede_id, nombre, _deporte_id, modalidades, caracteristicas, created_by, updated_by) VALUES 
('55a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '44a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 'La 11 Oficial', '99a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '{"Fútbol 11"}', '{"superficie": "Grass Natural", "techada": false}', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d') ON CONFLICT DO NOTHING;
INSERT INTO cancha_horario (cancha_id, dia_semana, hora_inicio, hora_fin, precio_por_hora, recargo_luz, created_by, updated_by) VALUES 
('55a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', 0, '08:00', '18:00', 80.00, 0.00, '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '11a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d') ON CONFLICT DO NOTHING;


-- Servicios Sede Chiclayo
INSERT INTO sede_servicio (sede_id, _servicio_id, es_gratuito) VALUES
('44a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '77a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', true), 
('44a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '77a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', true), 
('44a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '77a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', false),
('44a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', '77a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d', true)
ON CONFLICT DO NOTHING;
