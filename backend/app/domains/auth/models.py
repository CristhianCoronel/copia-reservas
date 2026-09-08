import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.mixins import AuditMixin

class Usuario(AuditMixin, Base):
    __tablename__ = "usuario"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False)
    codigo_referido = Column(String(6), unique=True, nullable=False)
    referido_por_usuario_id = Column(UUID(as_uuid=True), ForeignKey('usuario.id'))
    referido_por_empresa_id = Column(UUID(as_uuid=True)) # ForeignKey to empresa
    email = Column(String(255), unique=True, nullable=False)
    telefono = Column(String(30), unique=True)
    google_sub = Column(String(255), unique=True)
    password_hash = Column(String(255))
    proveedor_auth = Column(String(20), nullable=False)
    rol = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    email_verificado = Column(Boolean, default=False, nullable=False)
    telefono_verificado = Column(Boolean, default=False, nullable=False)
    ultimo_acceso_en = Column(DateTime(timezone=True))
    reset_password_token = Column(String(255))
    reset_password_expires_at = Column(DateTime(timezone=True))

    persona = relationship("Persona", back_populates="usuario", uselist=False)


class Persona(AuditMixin, Base):
    __tablename__ = "persona"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey('usuario.id'), unique=True, nullable=False)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    tipo_documento = Column(String(20), nullable=False)
    numero_documento = Column(String(30), unique=True, nullable=False)
    foto_perfil_url = Column(String(500))
    _partidos_completados = Column(Integer, default=0, nullable=False)

    usuario = relationship("Usuario", back_populates="persona")
    empresas_creadas = relationship("Empresa", back_populates="creador", foreign_keys="[Empresa.creada_por_persona_id]")
    contratos = relationship("Contrato", back_populates="persona", foreign_keys="[Contrato.persona_id]")
