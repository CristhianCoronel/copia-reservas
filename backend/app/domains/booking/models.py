import uuid
from sqlalchemy import Column, String, Boolean, Date, Time, ForeignKey, Integer, Numeric, Text, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.mixins import AuditMixin

class Deporte(AuditMixin, Base):
    __tablename__ = "_deporte"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(100), unique=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

class Servicio(AuditMixin, Base):
    __tablename__ = "_servicio"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(100), unique=True, nullable=False)
    icono = Column(String(100))
    categoria = Column(String(50))

class Cancha(AuditMixin, Base):
    __tablename__ = "cancha"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sede_id = Column(UUID(as_uuid=True), ForeignKey('sede.id'), nullable=False)
    nombre = Column(String(100), nullable=False)
    _deporte_id = Column(UUID(as_uuid=True), nullable=False)
    modalidades = Column(ARRAY(String))
    caracteristicas = Column(JSONB)
    is_active = Column(Boolean, default=True, nullable=False)

    sede = relationship("Sede", back_populates="canchas")
    reservas = relationship("Reserva", back_populates="cancha")
    fotos = relationship("CanchaFoto", back_populates="cancha")

class CanchaFoto(AuditMixin, Base):
    __tablename__ = "cancha_foto"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cancha_id = Column(UUID(as_uuid=True), ForeignKey('cancha.id'), nullable=False)
    foto_url = Column(String(500), nullable=False)
    orden = Column(Integer, default=0, nullable=False)

    cancha = relationship("Cancha", back_populates="fotos")


class Reserva(AuditMixin, Base):
    __tablename__ = "reserva"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    share_token = Column(String(100), unique=True, nullable=False)
    cancha_id = Column(UUID(as_uuid=True), ForeignKey('cancha.id'), nullable=False)
    tipo_origen = Column(String(20), nullable=False)
    persona_organizadora_id = Column(UUID(as_uuid=True), ForeignKey('persona.id'), nullable=False)
    equipo_id = Column(UUID(as_uuid=True))
    fecha_reserva = Column(Date, nullable=False)
    hora_inicio_solicitada = Column(Time, nullable=False)
    hora_fin_solicitada = Column(Time, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    duracion_horas = Column(Numeric(3,1), nullable=False)
    precio_hora_historico = Column(Numeric(10,2), nullable=False)
    precio_total_cancha = Column(Numeric(10,2), nullable=False)
    descuento_promocion_empresa = Column(Numeric(10,2), default=0.00, nullable=False)
    descuento_cupon_plataforma = Column(Numeric(10,2), default=0.00, nullable=False)
    monto_total_final = Column(Numeric(10,2), nullable=False)
    _saldo_pendiente = Column(Numeric(10,2), nullable=False)
    estado = Column(String(30), nullable=False)
    cancha = relationship("Cancha", back_populates="reservas")
    pagos = relationship("PagoReserva", back_populates="reserva")
    partida_abierta = relationship("PartidaAbierta", back_populates="reserva", uselist=False)

class Equipo(AuditMixin, Base):
    __tablename__ = "equipo"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(120), unique=True, nullable=False)
    share_token = Column(String(100), unique=True, nullable=False)
    creador_id = Column(UUID(as_uuid=True), ForeignKey('persona.id'), nullable=False)

    miembros = relationship("EquipoMiembro", back_populates="equipo")

class EquipoMiembro(AuditMixin, Base):
    __tablename__ = "equipo_miembro"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipo_id = Column(UUID(as_uuid=True), ForeignKey('equipo.id'), nullable=False)
    persona_id = Column(UUID(as_uuid=True), ForeignKey('persona.id'), nullable=False)
    rol = Column(String(30), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    equipo = relationship("Equipo", back_populates="miembros")
    persona = relationship("Persona")

class PagoReserva(AuditMixin, Base):
    __tablename__ = "pago_reserva"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reserva_id = Column(UUID(as_uuid=True), ForeignKey('reserva.id'), nullable=False)
    persona_id = Column(UUID(as_uuid=True), ForeignKey('persona.id'), nullable=False)
    monto = Column(Numeric(10,2), nullable=False)
    metodo_pago = Column(String(40), nullable=False)
    comprobante_url = Column(String(500))
    estado = Column(String(20), nullable=False)
    
    reserva = relationship("Reserva", back_populates="pagos")
    persona = relationship("Persona")

class PartidaAbierta(AuditMixin, Base):
    __tablename__ = "partida_abierta"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    share_token = Column(String(100), unique=True, nullable=False)
    reserva_id = Column(UUID(as_uuid=True), ForeignKey('reserva.id'), nullable=False)
    organizador_id = Column(UUID(as_uuid=True), ForeignKey('persona.id'), nullable=False)
    _deporte_id = Column(UUID(as_uuid=True), ForeignKey('_deporte.id'), nullable=False)
    presupuesto_meta = Column(Numeric(10,2), nullable=False)
    cupos_totales = Column(Integer, nullable=False)
    cupos_disponibles = Column(Integer, nullable=False)
    estado = Column(String(30), nullable=False)

    reserva = relationship("Reserva", back_populates="partida_abierta")
    participantes = relationship("PartidaAbiertaParticipante", back_populates="partida")

class PartidaAbiertaParticipante(AuditMixin, Base):
    __tablename__ = "partida_abierta_participante"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    partida_abierta_id = Column(UUID(as_uuid=True), ForeignKey('partida_abierta.id'), nullable=False)
    persona_id = Column(UUID(as_uuid=True), ForeignKey('persona.id'), nullable=False)
    aporte_monedero = Column(Numeric(10,2), nullable=False)

    partida = relationship("PartidaAbierta", back_populates="participantes")
