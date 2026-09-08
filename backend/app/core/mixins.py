from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

class AuditMixin:
    """
    Mixin para proveer auditoría descentralizada a todas las tablas operativas.
    Maneja fechas automáticas y rastreo de usuarios/acciones.
    """
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(UUID(as_uuid=True), nullable=True)
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    last_action = Column(String(20), nullable=False, default="CREATE")
