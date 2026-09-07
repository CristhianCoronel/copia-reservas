-- 01_schema.sql
-- DDL para la base de datos "Separa Altoke"

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- DOMINIO 1: CATÁLOGOS Y CONFIGURACIÓN GLOBAL
-- ==========================================

CREATE TABLE _pais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_iso VARCHAR(2) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    prefijo_telefonico VARCHAR(10) NOT NULL,
    longitud_celular_esperada INT NOT NULL,
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE _ubigeo_departamento (
    id VARCHAR(2) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE _ubigeo_provincia (
    id VARCHAR(4) PRIMARY KEY,
    departamento_id VARCHAR(2) NOT NULL REFERENCES _ubigeo_departamento(id),
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE _ubigeo_distrito (
    id VARCHAR(6) PRIMARY KEY,
    provincia_id VARCHAR(4) NOT NULL REFERENCES _ubigeo_provincia(id),
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE _sistema_configuracion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave VARCHAR(80) NOT NULL UNIQUE,
    valor JSONB NOT NULL,
    descripcion TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE _deporte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE _servicio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    icono VARCHAR(100),
    categoria VARCHAR(50)
);

CREATE TABLE _plan_suscripcion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_mensual NUMERIC(10,2) NOT NULL,
    precio_anual NUMERIC(10,2) NOT NULL,
    max_sedes INT NOT NULL,
    max_canchas INT NOT NULL,
    beneficios JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE _descuentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    tipo_descuento VARCHAR(20) NOT NULL CHECK (tipo_descuento IN ('PORCENTAJE', 'MONTO_FIJO')),
    valor_descuento NUMERIC(10,2) NOT NULL,
    monto_minimo_reserva NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    monto_maximo_descuento NUMERIC(10,2),
    limite_usos_global INT,
    _usos_actuales INT NOT NULL DEFAULT 0,
    limite_usos_por_usuario INT NOT NULL DEFAULT 1,
    acumulable_con_promociones BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE _programas_referidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    beneficio_referente_id UUID REFERENCES _descuentos(id),
    beneficio_referido_id UUID REFERENCES _descuentos(id),
    condicion_activacion VARCHAR(50) NOT NULL,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE _campanas_marketing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    canal VARCHAR(20) NOT NULL CHECK (canal IN ('PUSH', 'SMS', 'EMAIL')),
    segmento_filtro JSONB NOT NULL,
    programada_para TIMESTAMPTZ NOT NULL,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('BORRADOR', 'PROGRAMADA', 'ENVIADA', 'CANCELADA')),
    enviada_en TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- DOMINIO 2: IDENTIDAD, EMPRESAS Y SUSCRIPCIONES
-- ==========================================

CREATE TABLE usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    codigo_referido VARCHAR(6) NOT NULL UNIQUE,
    referido_por_usuario_id UUID, -- Se agrega FK más abajo tras crear la tabla persona/usuario
    referido_por_empresa_id UUID, -- Se agrega FK más abajo tras crear la tabla empresa
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(30) UNIQUE,
    google_sub VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    proveedor_auth VARCHAR(20) NOT NULL CHECK (proveedor_auth IN ('GOOGLE', 'LOCAL')),
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('ADMIN', 'PLAYER')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verificado BOOLEAN NOT NULL DEFAULT FALSE,
    telefono_verificado BOOLEAN NOT NULL DEFAULT FALSE,
    ultimo_acceso_en TIMESTAMPTZ,
    reset_password_token VARCHAR(255),
    reset_password_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE usuario_dispositivo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuario(id),
    fcm_token VARCHAR(500) NOT NULL UNIQUE,
    plataforma VARCHAR(20) NOT NULL CHECK (plataforma IN ('ANDROID', 'IOS', 'WEB')),
    modelo VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_uso_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE persona (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuario(id),
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    tipo_documento VARCHAR(20) NOT NULL CHECK (tipo_documento IN ('DNI', 'CE', 'PASAPORTE')),
    numero_documento VARCHAR(30) NOT NULL UNIQUE,
    foto_perfil_url VARCHAR(500),
    _partidos_completados INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE usuario ADD CONSTRAINT fk_usuario_referido FOREIGN KEY (referido_por_usuario_id) REFERENCES usuario(id);

CREATE TABLE _codigos_referidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES persona(id),
    programa_referido_id UUID NOT NULL REFERENCES _programas_referidos(id),
    codigo_unico VARCHAR(50) NOT NULL UNIQUE,
    _total_usos INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE _referidos_registro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_referido_id UUID NOT NULL REFERENCES _codigos_referidos(id),
    persona_referida_id UUID NOT NULL UNIQUE REFERENCES persona(id),
    estado VARCHAR(30) NOT NULL CHECK (estado IN ('REGISTRADO', 'PRIMER_PARTIDO_COMPLETADO', 'RECOMPENSA_ENTREGADA')),
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_completado_partido TIMESTAMPTZ,
    recompensa_entregada_en TIMESTAMPTZ
);

CREATE TABLE empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creada_por_persona_id UUID NOT NULL REFERENCES persona(id),
    share_token VARCHAR(100) NOT NULL UNIQUE,
    ruc VARCHAR(20) NOT NULL UNIQUE,
    razon_social VARCHAR(200) NOT NULL,
    nombre_comercial VARCHAR(200) NOT NULL,
    estado_aprobacion VARCHAR(30) NOT NULL CHECK (estado_aprobacion IN ('PENDIENTE', 'APROBADA', 'RECHAZADA')) DEFAULT 'PENDIENTE',
    contacto_legal VARCHAR(150),
    telefono_contacto VARCHAR(30) NOT NULL,
    email_contacto VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    terminos_condiciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE usuario ADD CONSTRAINT fk_usuario_empresa_referido FOREIGN KEY (referido_por_empresa_id) REFERENCES empresa(id);

CREATE TABLE suscripcion_empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresa(id),
    plan_id UUID NOT NULL REFERENCES _plan_suscripcion(id),
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ NOT NULL,
    estado VARCHAR(30) NOT NULL CHECK (estado IN ('ACTIVA', 'VENCIDA', 'CANCELADA', 'PENDIENTE_PAGO')),
    auto_renovacion BOOLEAN NOT NULL DEFAULT FALSE,
    comprobante_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- DOMINIO 3: SEDES, CONTRATOS Y SERVICIOS
-- ==========================================

CREATE TABLE sede (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresa(id),
    ubigeo_distrito_id VARCHAR(6) NOT NULL REFERENCES _ubigeo_distrito(id),
    nombre VARCHAR(150) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    referencia VARCHAR(255),
    latitud DOUBLE PRECISION NOT NULL,
    longitud DOUBLE PRECISION NOT NULL,
    maps_url VARCHAR(500),
    telefono VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    politica_cancelacion TEXT,
    horas_limite_cancelacion INT NOT NULL DEFAULT 24,
    max_horas_reserva_continua INT NOT NULL DEFAULT 2,
    reserva_minutos_espera INT NOT NULL DEFAULT 15,
    tipo_adelanto_requerido VARCHAR(20) NOT NULL CHECK (tipo_adelanto_requerido IN ('PORCENTAJE', 'MONTO_FIJO', 'NINGUNO')),
    valor_adelanto_requerido NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('ACTIVA', 'INACTIVA')) DEFAULT 'ACTIVA',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contrato (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresa(id),
    sede_id UUID REFERENCES sede(id),
    persona_id UUID NOT NULL REFERENCES persona(id),
    rol VARCHAR(40) NOT NULL CHECK (rol IN ('ADMINISTRADOR', 'RECEPCIONISTA', 'OPERADOR_MANTENIMIENTO')),
    otorgado_por UUID NOT NULL REFERENCES persona(id),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sede_horario_atencion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID NOT NULL REFERENCES sede(id),
    dia_semana INT NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
    hora_apertura TIME NOT NULL,
    hora_cierre TIME NOT NULL
);

CREATE TABLE sede_excepcion_horario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID NOT NULL REFERENCES sede(id),
    fecha_excepcion DATE NOT NULL,
    estado_operativo VARCHAR(20) NOT NULL CHECK (estado_operativo IN ('CERRADO', 'ABIERTO_ESPECIAL')),
    hora_apertura TIME,
    hora_cierre TIME,
    descripcion VARCHAR(255)
);

CREATE TABLE sede_servicio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID NOT NULL REFERENCES sede(id),
    _servicio_id UUID NOT NULL REFERENCES _servicio(id),
    es_gratuito BOOLEAN NOT NULL DEFAULT TRUE,
    costo_adicional NUMERIC(10,2),
    descripcion VARCHAR(255)
);

CREATE TABLE detalle_particular_sede (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID NOT NULL REFERENCES sede(id),
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    orden INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sede_saldo_cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID NOT NULL REFERENCES sede(id),
    persona_id UUID NOT NULL REFERENCES persona(id),
    monto_a_favor NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    ultimo_movimiento TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sede_lista_negra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID NOT NULL REFERENCES sede(id),
    persona_id UUID NOT NULL REFERENCES persona(id),
    motivo TEXT NOT NULL,
    fecha_bloqueo TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- DOMINIO 4: CANCHAS, BLOQUEOS Y TARIFAS
-- ==========================================

CREATE TABLE cancha (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID NOT NULL REFERENCES sede(id),
    nombre VARCHAR(100) NOT NULL,
    _deporte_id UUID NOT NULL REFERENCES _deporte(id),
    modalidades VARCHAR[],
    caracteristicas JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cancha_foto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cancha_id UUID NOT NULL REFERENCES cancha(id),
    foto_url VARCHAR(500) NOT NULL,
    orden INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cancha_solapamiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cancha_principal_id UUID NOT NULL REFERENCES cancha(id),
    cancha_bloqueada_id UUID NOT NULL REFERENCES cancha(id)
);

CREATE TABLE cancha_horario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cancha_id UUID NOT NULL REFERENCES cancha(id),
    dia_semana INT NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    precio_por_hora NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE cancha_bloqueo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cancha_id UUID NOT NULL REFERENCES cancha(id),
    fecha_hora_inicio TIMESTAMPTZ NOT NULL,
    fecha_hora_fin TIMESTAMPTZ NOT NULL,
    motivo VARCHAR(50) NOT NULL CHECK (motivo IN ('MANTENIMIENTO', 'MAL_CLIMA', 'EVENTO_INTERNO', 'REPARACION')),
    descripcion TEXT,
    registrado_por UUID NOT NULL REFERENCES persona(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE promocion_sede (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID NOT NULL REFERENCES sede(id),
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    tipo_descuento VARCHAR(20) NOT NULL CHECK (tipo_descuento IN ('PORCENTAJE', 'MONTO_FIJO')),
    valor_descuento NUMERIC(10,2) NOT NULL,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ NOT NULL,
    dias_semana INT[],
    hora_inicio TIME,
    hora_fin TIME,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- DOMINIO 5: EQUIPOS, RESERVAS Y PAGOS
-- ==========================================

CREATE TABLE equipo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(120) NOT NULL UNIQUE,
    share_token VARCHAR(100) NOT NULL UNIQUE,
    creador_id UUID NOT NULL REFERENCES persona(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE equipo_miembro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id UUID NOT NULL REFERENCES equipo(id),
    persona_id UUID NOT NULL REFERENCES persona(id),
    rol VARCHAR(30) NOT NULL CHECK (rol IN ('CAPITAN', 'JUGADOR')),
    fecha_ingreso TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE reserva (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_token VARCHAR(100) NOT NULL UNIQUE,
    cancha_id UUID NOT NULL REFERENCES cancha(id),
    tipo_origen VARCHAR(20) NOT NULL CHECK (tipo_origen IN ('INDIVIDUAL', 'EQUIPO', 'PARTIDA_ABIERTA')),
    persona_organizadora_id UUID NOT NULL REFERENCES persona(id),
    equipo_id UUID REFERENCES equipo(id),
    fecha_reserva DATE NOT NULL,
    hora_inicio_solicitada TIME NOT NULL,
    hora_fin_solicitada TIME NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    duracion_horas NUMERIC(3,1) NOT NULL,
    precio_hora_historico NUMERIC(10,2) NOT NULL,
    precio_total_cancha NUMERIC(10,2) NOT NULL,
    descuento_promocion_empresa NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    descuento_cupon_plataforma NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    monto_total_final NUMERIC(10,2) NOT NULL,
    _saldo_pendiente NUMERIC(10,2) NOT NULL,
    estado VARCHAR(30) NOT NULL CHECK (estado IN ('PENDIENTE_PAGO', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA')),
    expira_en TIMESTAMPTZ,
    confirmado_en TIMESTAMPTZ,
    cancelado_por UUID REFERENCES persona(id),
    motivo_cancelacion TEXT,
    cancelado_en TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reserva_asistencia_equipo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reserva_id UUID NOT NULL REFERENCES reserva(id),
    persona_id UUID NOT NULL REFERENCES persona(id),
    estado_asistencia VARCHAR(30) NOT NULL CHECK (estado_asistencia IN ('ASISTIRA', 'NO_ASISTIRA', 'SIN_RESPUESTA')) DEFAULT 'SIN_RESPUESTA',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pago_reserva (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reserva_id UUID NOT NULL REFERENCES reserva(id),
    persona_id UUID NOT NULL REFERENCES persona(id),
    monto NUMERIC(10,2) NOT NULL,
    metodo_pago VARCHAR(40) NOT NULL CHECK (metodo_pago IN ('TRANSFERENCIA_EXTERNA', 'YAPE', 'PLIN', 'EFECTIVO', 'MONEDERO_INTERNO')),
    comprobante_url VARCHAR(500),
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO')),
    revisado_por UUID REFERENCES persona(id),
    revisado_en TIMESTAMPTZ,
    motivo_rechazo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE _descuento_uso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descuento_id UUID NOT NULL REFERENCES _descuentos(id),
    persona_id UUID NOT NULL REFERENCES persona(id),
    reserva_id UUID NOT NULL REFERENCES reserva(id),
    monto_descontado NUMERIC(10,2) NOT NULL,
    fecha_uso TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- DOMINIO 6: MONEDERO Y PARTIDAS ABIERTAS
-- ==========================================

CREATE TABLE monedero (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL UNIQUE REFERENCES persona(id),
    saldo_disponible NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    saldo_retenido NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transaccion_monedero (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monedero_id UUID NOT NULL REFERENCES monedero(id),
    tipo_transaccion VARCHAR(30) NOT NULL CHECK (tipo_transaccion IN ('RECARGA', 'APORTE_PARTIDA_ABIERTA', 'REEMBOLSO_PARTIDA_ABIERTA', 'PAGO_RESERVA', 'RETIRO')),
    monto NUMERIC(10,2) NOT NULL,
    referencia_id UUID,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE partida_abierta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_token VARCHAR(100) NOT NULL UNIQUE,
    reserva_id UUID NOT NULL UNIQUE REFERENCES reserva(id),
    organizador_id UUID NOT NULL REFERENCES persona(id),
    _deporte_id UUID NOT NULL REFERENCES _deporte(id), -- Añadido según plan
    presupuesto_meta NUMERIC(10,2) NOT NULL,
    cupos_totales INT NOT NULL,
    cupos_disponibles INT NOT NULL,
    estado VARCHAR(30) NOT NULL CHECK (estado IN ('RECAUDANDO', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE partida_abierta_participante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partida_abierta_id UUID NOT NULL REFERENCES partida_abierta(id),
    persona_id UUID NOT NULL REFERENCES persona(id),
    aporte_monedero NUMERIC(10,2) NOT NULL,
    fecha_ingreso TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- DOMINIO 7: CHAT NATIVO
-- ==========================================

CREATE TABLE chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_canal VARCHAR(30) NOT NULL CHECK (tipo_canal IN ('JUGADOR_JUGADOR', 'EQUIPO', 'PARTIDA_ABIERTA', 'JUGADOR_EMPRESA')),
    referencia_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat_participante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chat(id),
    persona_id UUID NOT NULL REFERENCES persona(id),
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('ADMIN', 'MIEMBRO')),
    ultimo_leido_en TIMESTAMPTZ,
    _no_leidos INT NOT NULL DEFAULT 0,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mensaje (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chat(id),
    remitente_id UUID NOT NULL REFERENCES persona(id),
    tipo_mensaje VARCHAR(30) NOT NULL CHECK (tipo_mensaje IN ('TEXTO', 'IMAGEN', 'AUDIO', 'COMPROBANTE_PAGO', 'REEMBOLSO', 'INVITACION', 'NOTIFICACION_RESERVA')),
    contenido_texto TEXT,
    archivo_url VARCHAR(500),
    datos_objeto JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- DOMINIO 8: AUDITORÍA Y TRAZABILIDAD
-- ==========================================

CREATE TABLE auditoria_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuario(id),
    contrato_id UUID REFERENCES contrato(id),
    sede_id UUID REFERENCES sede(id),
    accion VARCHAR(50) NOT NULL CHECK (accion IN ('CANCELACION_RESERVA', 'APROBACION_PAGO', 'RECHAZO_PAGO', 'MODIFICACION_TARIFA', 'BLOQUEO_CANCHA', 'ACCESO_SISTEMA')),
    tabla_afectada VARCHAR(60) NOT NULL,
    registro_id UUID NOT NULL,
    datos_previos JSONB,
    datos_nuevos JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- ÍNDICES DE RENDIMIENTO OBLIGATORIOS
-- ==========================================

CREATE INDEX idx_sede_coordenadas ON sede (latitud, longitud) WHERE estado = 'ACTIVA';
CREATE INDEX idx_reserva_cancha_fecha ON reserva (cancha_id, fecha_reserva, estado);
CREATE INDEX idx_reserva_purga_expiracion ON reserva (expira_en) WHERE estado = 'PENDIENTE_PAGO';
CREATE INDEX idx_partida_abierta_disponible ON partida_abierta (_deporte_id, estado) WHERE estado = 'RECAUDANDO';
CREATE INDEX idx_chat_updated_at ON chat (updated_at DESC);
CREATE INDEX idx_mensaje_chat_cronologico ON mensaje (chat_id, created_at ASC);
CREATE INDEX idx_auditoria_sede_fecha ON auditoria_log (sede_id, created_at DESC);
CREATE INDEX idx_contrato_persona_activa ON contrato (persona_id, empresa_id, sede_id) WHERE is_active = TRUE;
CREATE UNIQUE INDEX idx_usuario_google_sub ON usuario (google_sub) WHERE google_sub IS NOT NULL;
