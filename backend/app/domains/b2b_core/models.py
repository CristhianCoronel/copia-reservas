import uuid
from sqlalchemy import Column, String, Boolean, Date, ForeignKey, Integer, Float, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.mixins import AuditMixin

class Empresa(AuditMixin, Base):
    __tablename__ = "empresa"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    creada_por_persona_id = Column(UUID(as_uuid=True), ForeignKey('persona.id'), nullable=False)
    share_token = Column(String(100), unique=True, nullable=False)
    ruc = Column(String(20), unique=True, nullable=False)
    razon_social = Column(String(200), nullable=False)
    nombre_comercial = Column(String(200), nullable=False)
    estado_aprobacion = Column(String(30), default='PENDIENTE', nullable=False)
    contacto_legal = Column(String(150))
    telefono_contacto = Column(String(30), nullable=False)
    email_contacto = Column(String(255), nullable=False)
    logo_url = Column(String(500))
    terminos_condiciones = Column(Text)

    creador = relationship("Persona", back_populates="empresas_creadas", foreign_keys=[creada_por_persona_id])
    sedes = relationship("Sede", back_populates="empresa")
    contratos = relationship("Contrato", back_populates="empresa")


class Sede(AuditMixin, Base):
    __tablename__ = "sede"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey('empresa.id'), nullable=False)
    ubigeo_distrito_id = Column(String(6), nullable=False)
    nombre = Column(String(150), nullable=False)
    direccion = Column(String(255), nullable=False)
    referencia = Column(String(255))
    latitud = Column(Float, nullable=False)
    longitud = Column(Float, nullable=False)
    maps_url = Column(String(500))
    telefono = Column(String(30), nullable=False)
    email = Column(String(255))
    politica_cancelacion = Column(Text)
    horas_limite_cancelacion = Column(Integer, default=24, nullable=False)
    max_horas_reserva_continua = Column(Integer, default=2, nullable=False)
    reserva_minutos_espera = Column(Integer, default=15, nullable=False)
    tipo_adelanto_requerido = Column(String(20), nullable=False)
    valor_adelanto_requerido = Column(Numeric(10,2), default=0.00, nullable=False)
    estado = Column(String(20), default='ACTIVA', nullable=False)

    empresa = relationship("Empresa", back_populates="sedes")
    canchas = relationship("Cancha", back_populates="sede")


class Contrato(AuditMixin, Base):
    __tablename__ = "contrato"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey('empresa.id'), nullable=False)
    sede_id = Column(UUID(as_uuid=True), ForeignKey('sede.id'))
    persona_id = Column(UUID(as_uuid=True), ForeignKey('persona.id'), nullable=False)
    rol = Column(String(40), nullable=False)
    otorgado_por = Column(UUID(as_uuid=True), ForeignKey('persona.id'), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date)
    is_active = Column(Boolean, default=True, nullable=False)

    empresa = relationship("Empresa", back_populates="contratos")
    persona = relationship("Persona", back_populates="contratos", foreign_keys=[persona_id])
