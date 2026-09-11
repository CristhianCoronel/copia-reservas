import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.mixins import AuditMixin

class Chat(AuditMixin, Base):
    __tablename__ = "chat"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tipo_canal = Column(String(30), nullable=False)
    referencia_id = Column(UUID(as_uuid=True))

    participantes = relationship("ChatParticipante", back_populates="chat")
    mensajes = relationship("Mensaje", back_populates="chat", order_by="Mensaje.created_at")

class ChatParticipante(AuditMixin, Base):
    __tablename__ = "chat_participante"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), ForeignKey('chat.id'), nullable=False)
    persona_id = Column(UUID(as_uuid=True), ForeignKey('persona.id'), nullable=False)
    rol = Column(String(20), nullable=False)
    ultimo_leido_en = Column(DateTime(timezone=True))
    _no_leidos = Column(Integer, default=0, nullable=False)
    joined_at = Column(DateTime(timezone=True), nullable=False)

    chat = relationship("Chat", back_populates="participantes")
    persona = relationship("Persona")

class Mensaje(AuditMixin, Base):
    __tablename__ = "mensaje"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), ForeignKey('chat.id'), nullable=False)
    remitente_id = Column(UUID(as_uuid=True), ForeignKey('persona.id'), nullable=False)
    tipo_mensaje = Column(String(30), nullable=False)
    contenido_texto = Column(Text)
    archivo_url = Column(String(500))
    datos_objeto = Column(JSONB)

    chat = relationship("Chat", back_populates="mensajes")
    remitente = relationship("Persona")
